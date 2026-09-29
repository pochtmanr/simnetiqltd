-- M3 project pulls. Additive after 20260929150000_finance_core.sql.
-- Recovery: drop the tables and functions created below. Do not drop schema
-- business_os. Do not apply this file to the marketing database.

do $guard$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'marketing_contacts'
  ) then
    raise exception 'refusing Business OS migration: public.marketing_contacts is present';
  end if;
  if to_regclass('business_os.source_observations') is null then
    raise exception 'finance_core_missing';
  end if;
end
$guard$;

alter table business_os.source_observations
  add column source_record_id text;

alter table business_os.source_observations
  add constraint source_observations_record_id_len
  check (source_record_id is null or char_length(source_record_id) between 1 and 160);

create unique index source_observations_record_revision_idx
  on business_os.source_observations (project_id, environment, source_record_id, revision)
  where source_record_id is not null;

create table business_os.source_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  environment text not null check (environment in ('local', 'staging', 'production')),
  source_environment text not null check (source_environment in ('production', 'staging', 'test')),
  base_url text not null,
  key_id text not null,
  secret_reference text not null check (secret_reference ~ '^[A-Z][A-Z0-9_]{2,64}$'),
  enabled boolean not null default false,
  contract_version text,
  formula_versions text[] not null default '{}',
  fx_policy_version text,
  recognition_basis text check (recognition_basis is null or recognition_basis in (
    'purchase', 'earned_management', 'settled_cash', 'sms_legacy'
  )),
  timezone text,
  page_limit integer not null default 100 check (page_limit between 1 and 500),
  capabilities jsonb,
  capabilities_validated_at timestamptz,
  enabled_datasets text[] not null default '{}',
  initial_from timestamptz,
  initial_to timestamptz,
  lease_owner text,
  lease_until timestamptz,
  next_attempt_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  enabled_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_connections_project_environment_key unique (project_id, environment),
  check (
    (source_environment = 'production' and environment = 'production')
    or (source_environment = 'staging' and environment = 'staging')
    or (source_environment = 'test' and environment = 'local')
  ),
  check (enabled = false or (
    capabilities_validated_at is not null
    and enabled_by is not null
    and contract_version = 'business-os.contract.v1'
    and recognition_basis is not null
    and initial_from is not null
    and initial_to is not null
    and cardinality(enabled_datasets) > 0
  ))
);

create index source_connections_claim_idx
  on business_os.source_connections (next_attempt_at, updated_at)
  where enabled;

create table business_os.sync_cursors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  connection_id uuid not null references business_os.source_connections (id),
  endpoint text not null,
  phase text not null check (phase in ('backfill', 'incremental')),
  initial_from timestamptz not null,
  initial_to timestamptz not null,
  cursor text,
  snapshot_id text,
  high_watermark text,
  query_sha256 text,
  checkpoint text,
  covered_through timestamptz,
  last_committed_at timestamptz,
  constraint sync_cursors_connection_endpoint_key unique (connection_id, endpoint),
  check (initial_from < initial_to),
  check (query_sha256 is null or query_sha256 ~ '^[a-f0-9]{64}$')
);

create index sync_cursors_connection_idx
  on business_os.sync_cursors (connection_id, last_committed_at);

create table business_os.sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  connection_id uuid not null references business_os.source_connections (id),
  endpoint text not null,
  status text not null check (status in ('leased', 'committed', 'failed', 'quarantined', 'resync')),
  attempt integer not null check (attempt >= 1),
  error_code text,
  error_detail text,
  worker_id text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  check (error_code is null or error_code ~ '^[a-z0-9_]{1,64}$'),
  check (error_detail is null or char_length(error_detail) <= 200)
);

create index sync_runs_connection_idx
  on business_os.sync_runs (connection_id, started_at desc);

create table business_os.import_quarantine (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  connection_id uuid not null references business_os.source_connections (id),
  endpoint text not null,
  reason text not null check (reason in ('hash_conflict', 'binding_error', 'schema')),
  record_id text,
  revision integer,
  content_hash text,
  detail text,
  created_at timestamptz not null default now(),
  check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  check (detail is null or char_length(detail) <= 200)
);

create index import_quarantine_connection_idx
  on business_os.import_quarantine (connection_id, created_at desc);

create table business_os.imported_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  connection_id uuid not null references business_os.source_connections (id),
  dataset text not null,
  snapshot_id text not null,
  body jsonb not null,
  grain text,
  timezone text,
  coverage text,
  data_as_of timestamptz,
  cutoff_from timestamptz,
  cutoff_to timestamptz,
  status text not null check (status in ('current', 'stale', 'retained')),
  created_at timestamptz not null default now(),
  constraint imported_snapshots_identity_key unique (connection_id, dataset, snapshot_id)
);

create unique index imported_snapshots_current_idx
  on business_os.imported_snapshots (connection_id, dataset)
  where status = 'current';

create index imported_snapshots_connection_idx
  on business_os.imported_snapshots (connection_id, dataset, created_at desc);

create table business_os.source_health (
  connection_id uuid primary key references business_os.source_connections (id),
  organization_id uuid not null references business_os.organizations (id),
  status text not null check (status in ('ok', 'degraded', 'outage', 'unconfigured')),
  last_success_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  lag_seconds integer
);

create function business_os.normalize_source_url(raw text)
returns text
language plpgsql
immutable
set search_path = ''
as $fn$
declare
  trimmed text;
begin
  trimmed := btrim(raw);
  trimmed := regexp_replace(trimmed, '/+$', '');
  if position('@' in trimmed) > 0
     or position('?' in trimmed) > 0
     or position('#' in trimmed) > 0
     or trimmed !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?$' then
    raise exception 'base_url_invalid' using errcode = '22023';
  end if;
  return trimmed;
end;
$fn$;

create function business_os.touch_source_health(
  target uuid,
  org_id uuid,
  next_status text,
  error_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  covered timestamptz;
begin
  select max(c.covered_through) into covered
  from business_os.sync_cursors c
  where c.connection_id = target;

  insert into business_os.source_health (
    connection_id, organization_id, status, last_success_at, last_error_code, last_error_at, lag_seconds
  ) values (
    target,
    org_id,
    next_status,
    case when next_status = 'ok' then clock_timestamp() else null end,
    case when next_status = 'ok' then null else error_code end,
    case when next_status = 'ok' then null else clock_timestamp() end,
    case
      when covered is null then null
      else greatest(0, floor(extract(epoch from clock_timestamp() - covered)))::integer
    end
  )
  on conflict on constraint source_health_pkey do update set
    status = excluded.status,
    last_success_at = case
      when excluded.status = 'ok' then excluded.last_success_at
      else business_os.source_health.last_success_at
    end,
    last_error_code = excluded.last_error_code,
    last_error_at = excluded.last_error_at,
    lag_seconds = excluded.lag_seconds;
end;
$fn$;

create function business_os.register_source_connection(
  actor_id uuid,
  target_project_id uuid,
  target_source_environment text,
  target_base_url text,
  target_key_id text,
  target_secret_reference text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  slug text;
  environment text;
  base_url text;
  connection_id uuid;
begin
  if target_secret_reference !~ '^[A-Z][A-Z0-9_]{2,64}$' then
    raise exception 'secret_reference_invalid' using errcode = '22023';
  end if;
  if target_key_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' then
    raise exception 'key_invalid' using errcode = '22023';
  end if;
  environment := case target_source_environment
    when 'production' then 'production'
    when 'staging' then 'staging'
    when 'test' then 'local'
    else null
  end;
  if environment is null then
    raise exception 'environment_invalid' using errcode = '22023';
  end if;
  base_url := business_os.normalize_source_url(target_base_url);

  select p.organization_id, p.slug into org_id, slug
  from business_os.projects p
  join business_os.memberships m on m.organization_id = p.organization_id
  where p.id = target_project_id
    and m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null;
  if org_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  insert into business_os.source_connections (
    organization_id, project_id, environment, source_environment, base_url, key_id, secret_reference
  ) values (
    org_id, target_project_id, environment, target_source_environment, base_url, target_key_id, target_secret_reference
  )
  on conflict on constraint source_connections_project_environment_key do update set
    source_environment = excluded.source_environment,
    base_url = excluded.base_url,
    key_id = excluded.key_id,
    secret_reference = excluded.secret_reference,
    enabled = false,
    contract_version = null,
    formula_versions = '{}',
    fx_policy_version = null,
    recognition_basis = null,
    timezone = null,
    capabilities = null,
    capabilities_validated_at = null,
    enabled_datasets = '{}',
    enabled_by = null,
    lease_owner = null,
    lease_until = null,
    updated_at = clock_timestamp()
  returning id into connection_id;

  perform business_os.touch_source_health(connection_id, org_id, 'unconfigured', null);
  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'register_source_connection', slug || ':' || target_source_environment);
  return connection_id;
end;
$fn$;

create function business_os.enable_source_connection(
  actor_id uuid,
  target_connection_id uuid,
  target_capabilities jsonb,
  target_datasets text[],
  target_basis text,
  target_page_limit integer,
  target_from timestamptz,
  target_to timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  conn business_os.source_connections%rowtype;
  slug text;
  formulas text[];
begin
  if target_basis not in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  if target_page_limit is null or target_page_limit < 1 or target_page_limit > 500 then
    raise exception 'page_limit_invalid' using errcode = '22023';
  end if;
  if target_from is null or target_to is null or target_from >= target_to
     or target_to - target_from > interval '366 days' then
    raise exception 'period_invalid' using errcode = '22023';
  end if;
  if target_datasets is null or cardinality(target_datasets) = 0 or exists (
    select 1 from unnest(target_datasets) as dataset
    where dataset not in (
      'finance/records', 'overview', 'finance/summary', 'finance/daily', 'finance/balances',
      'finance/reconciliation', 'subscriptions/summary', 'operations/daily',
      'analytics/ga4_overview_daily', 'analytics/ga4_breakdown', 'analytics/ga4_period_unique_users',
      'analytics/gsc_daily_totals', 'analytics/gsc_dimension_rows', 'analytics/vercel_daily'
    )
  ) then
    raise exception 'dataset_invalid' using errcode = '22023';
  end if;
  if target_capabilities ->> 'contract_version' is distinct from 'business-os.contract.v1' then
    raise exception 'contract_mismatch' using errcode = '22023';
  end if;

  select p.organization_id, p.slug into org_id, slug
  from business_os.projects p
  join business_os.memberships m on m.organization_id = p.organization_id
  join business_os.source_connections c on c.project_id = p.id and c.organization_id = p.organization_id
  where c.id = target_connection_id
    and m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null
  for update of c;
  if org_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  select * into conn
  from business_os.source_connections
  where id = target_connection_id
  for update;

  if target_capabilities ->> 'project_id' is distinct from slug
     or target_capabilities ->> 'environment' is distinct from conn.source_environment then
    raise exception 'project_mismatch' using errcode = '22023';
  end if;

  select coalesce(array_agg(value), '{}') into formulas
  from jsonb_array_elements_text(target_capabilities -> 'formula_versions') as item(value);
  if formulas is null or cardinality(formulas) = 0 then
    raise exception 'contract_mismatch' using errcode = '22023';
  end if;

  update business_os.source_connections
  set enabled = true,
      contract_version = 'business-os.contract.v1',
      formula_versions = formulas,
      fx_policy_version = target_capabilities ->> 'fx_policy_version',
      recognition_basis = target_basis,
      timezone = coalesce(target_capabilities ->> 'timezone', 'Europe/London'),
      page_limit = target_page_limit,
      capabilities = target_capabilities,
      capabilities_validated_at = clock_timestamp(),
      enabled_datasets = target_datasets,
      initial_from = target_from,
      initial_to = target_to,
      enabled_by = actor_id,
      next_attempt_at = null,
      failure_count = 0,
      updated_at = clock_timestamp()
  where id = conn.id;

  insert into business_os.sync_cursors (
    organization_id, connection_id, endpoint, phase, initial_from, initial_to
  )
  select conn.organization_id, conn.id, dataset, 'backfill', target_from, target_to
  from unnest(target_datasets) as dataset
  on conflict on constraint sync_cursors_connection_endpoint_key do nothing;

  perform business_os.touch_source_health(conn.id, org_id, 'unconfigured', null);
  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'enable_source_connection', slug || ':' || conn.source_environment);
  return conn.id;
end;
$fn$;

create function business_os.claim_sync_lease(worker_id text, lease_seconds integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  conn business_os.source_connections%rowtype;
  slug text;
  endpoint text;
  cursor_row business_os.sync_cursors%rowtype;
begin
  if worker_id !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'worker_invalid' using errcode = '22023';
  end if;
  if lease_seconds < 15 or lease_seconds > 300 then
    raise exception 'lease_invalid' using errcode = '22023';
  end if;

  select * into conn
  from business_os.source_connections c
  where c.enabled
    and (c.lease_until is null or c.lease_until <= clock_timestamp())
    and (c.next_attempt_at is null or c.next_attempt_at <= clock_timestamp())
  order by c.next_attempt_at nulls first, c.updated_at, c.id
  limit 1
  for update skip locked;

  if conn.id is null then
    return null;
  end if;

  select p.slug into slug
  from business_os.projects p
  where p.id = conn.project_id;

  select c.endpoint into endpoint
  from business_os.sync_cursors c
  where c.connection_id = conn.id
    and c.endpoint = any (conn.enabled_datasets)
  order by c.last_committed_at nulls first, c.endpoint
  limit 1;
  if endpoint is null then
    return null;
  end if;

  select * into cursor_row
  from business_os.sync_cursors
  where connection_id = conn.id
    and sync_cursors.endpoint = endpoint;

  update business_os.source_connections
  set lease_owner = worker_id,
      lease_until = clock_timestamp() + make_interval(secs => lease_seconds),
      updated_at = clock_timestamp()
  where id = conn.id;

  insert into business_os.sync_runs (
    organization_id, connection_id, endpoint, status, attempt, worker_id
  ) values (
    conn.organization_id, conn.id, endpoint, 'leased', greatest(conn.failure_count, 1), worker_id
  );

  return jsonb_build_object(
    'connection_id', conn.id,
    'project_slug', slug,
    'environment', conn.environment,
    'source_environment', conn.source_environment,
    'base_url', conn.base_url,
    'key_id', conn.key_id,
    'secret_reference', conn.secret_reference,
    'endpoint', endpoint,
    'cursor', cursor_row.cursor,
    'phase', cursor_row.phase,
    'initial_from', to_char(cursor_row.initial_from at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'initial_to', to_char(cursor_row.initial_to at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'snapshot_id', cursor_row.snapshot_id,
    'checkpoint', cursor_row.checkpoint,
    'page_limit', conn.page_limit,
    'actor_id', conn.enabled_by,
    'recognition_basis', conn.recognition_basis,
    'timezone', conn.timezone
  );
end;
$fn$;

create function business_os.finish_sync_lease(
  target uuid,
  worker_id text,
  next_status text,
  error_code text,
  retry_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  conn business_os.source_connections%rowtype;
begin
  select * into conn
  from business_os.source_connections
  where id = target
  for update;
  if conn.id is null then
    raise exception 'connection_missing' using errcode = '22023';
  end if;
  if conn.lease_owner is distinct from worker_id then
    return;
  end if;
  update business_os.source_connections
  set lease_owner = null,
      lease_until = null,
      next_attempt_at = case
        when retry_seconds is null then null
        else clock_timestamp() + make_interval(secs => retry_seconds)
      end,
      failure_count = case when next_status = 'ok' then 0 else failure_count + 1 end,
      updated_at = clock_timestamp()
  where id = conn.id;
  perform business_os.touch_source_health(conn.id, conn.organization_id, next_status, error_code);
end;
$fn$;

create function business_os.commit_records_page(
  target uuid,
  worker_id text,
  page jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  conn business_os.source_connections%rowtype;
  slug text;
  endpoint text;
  has_more boolean;
  row record;
  payload jsonb;
  quarantine jsonb := '[]'::jsonb;
  existing_hash text;
  prev_id uuid;
  posted jsonb;
  obs_id uuid;
begin
  if worker_id !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'worker_invalid' using errcode = '22023';
  end if;
  select * into conn
  from business_os.source_connections c
  where c.id = target
    and c.lease_owner = worker_id
    and c.lease_until > clock_timestamp()
  for update;
  if conn.id is null then
    raise exception 'lease_lost' using errcode = '42501';
  end if;

  endpoint := page ->> 'endpoint';
  if endpoint is null or not (endpoint = any (conn.enabled_datasets)) then
    raise exception 'dataset_invalid' using errcode = '22023';
  end if;
  if endpoint <> 'finance/records' then
    raise exception 'dataset_invalid' using errcode = '22023';
  end if;
  if jsonb_typeof(page -> 'records') <> 'array' or jsonb_typeof(page -> 'has_more') <> 'boolean' then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  has_more := (page ->> 'has_more')::boolean;
  if has_more and nullif(page ->> 'next_cursor', '') is null then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  if not has_more and nullif(page ->> 'checkpoint', '') is null then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  select p.slug into slug from business_os.projects p where p.id = conn.project_id;

  if jsonb_typeof(page -> 'quarantine') = 'array' and jsonb_array_length(page -> 'quarantine') > 0 then
    quarantine := page -> 'quarantine';
  end if;

  for row in
    select item.value as payload
    from jsonb_array_elements(page -> 'records') as item(value)
    order by (item.value ->> 'change_sequence')::numeric
  loop
    payload := row.payload;
    if payload ->> 'project_slug' is distinct from slug
       or payload ->> 'environment' is distinct from conn.environment then
      quarantine := quarantine || jsonb_build_array(jsonb_build_object(
        'reason', 'binding_error',
        'record_id', payload ->> 'record_id',
        'revision', payload -> 'revision',
        'content_hash', payload ->> 'content_hash',
        'detail', case
          when payload ->> 'project_slug' is distinct from slug then 'project_mismatch'
          else 'environment_mismatch'
        end
      ));
      continue;
    end if;

    select o.content_hash into existing_hash
    from business_os.source_observations o
    where o.project_id = conn.project_id
      and o.environment = conn.environment
      and o.revision = (payload ->> 'revision')::integer
      and (
        o.source_record_id = payload ->> 'record_id'
        or (
          o.external_object_id = payload ->> 'external_object_id'
          and o.event_kind = payload ->> 'event_kind'
          and o.external_adjustment_id = coalesce(payload ->> 'external_adjustment_id', '')
        )
      )
    limit 1;
    if found and existing_hash is distinct from payload ->> 'content_hash' then
      quarantine := quarantine || jsonb_build_array(jsonb_build_object(
        'reason', 'hash_conflict',
        'record_id', payload ->> 'record_id',
        'revision', payload -> 'revision',
        'content_hash', payload ->> 'content_hash',
        'detail', 'hash_conflict'
      ));
    end if;
  end loop;

  if jsonb_array_length(quarantine) > 0 then
    insert into business_os.import_quarantine (
      organization_id, connection_id, endpoint, reason, record_id, revision, content_hash, detail
    )
    select
      conn.organization_id,
      conn.id,
      endpoint,
      item ->> 'reason',
      item ->> 'record_id',
      nullif(item ->> 'revision', '')::integer,
      item ->> 'content_hash',
      left(item ->> 'detail', 200)
    from jsonb_array_elements(quarantine) as item;
    insert into business_os.sync_runs (
      organization_id, connection_id, endpoint, status, attempt, error_code, error_detail, worker_id, finished_at
    ) values (
      conn.organization_id, conn.id, endpoint, 'quarantined', greatest(conn.failure_count + 1, 1),
      'quarantine', 'page_not_committed', worker_id, clock_timestamp()
    );
    perform business_os.finish_sync_lease(conn.id, worker_id, 'degraded', 'quarantine', 3600);
    return jsonb_build_object('committed', false, 'quarantined', jsonb_array_length(quarantine));
  end if;

  for row in
    select item.value as payload
    from jsonb_array_elements(page -> 'records') as item(value)
    order by (item.value ->> 'change_sequence')::numeric
  loop
    payload := row.payload;
    select o.content_hash into existing_hash
    from business_os.source_observations o
    where o.project_id = conn.project_id
      and o.environment = conn.environment
      and o.source_record_id = payload ->> 'record_id'
      and o.revision = (payload ->> 'revision')::integer;
    if found and existing_hash = payload ->> 'content_hash' then
      continue;
    end if;

    if payload ->> 'status' = 'void' then
      prev_id := null;
      select o.id into prev_id
      from business_os.source_observations o
      where o.project_id = conn.project_id
        and o.environment = conn.environment
        and o.source_record_id = payload ->> 'record_id'
        and o.revision = nullif(payload ->> 'supersedes_revision', '')::integer
        and o.status <> 'void';
      if prev_id is not null then
        perform business_os.void_source_observation(conn.enabled_by, prev_id, 'source_revision_void');
      end if;
      posted := business_os.post_source_observation(
        conn.enabled_by,
        payload || jsonb_build_object('posting', false)
      );
      obs_id := (posted ->> 'observation_id')::uuid;
      update business_os.source_observations
      set status = 'void',
          source_record_id = payload ->> 'record_id'
      where id = obs_id;
    elsif coalesce((payload ->> 'revision')::integer, 1) > 1 then
      prev_id := null;
      select o.id into prev_id
      from business_os.source_observations o
      where o.project_id = conn.project_id
        and o.environment = conn.environment
        and o.source_record_id = payload ->> 'record_id'
        and o.revision = nullif(payload ->> 'supersedes_revision', '')::integer
        and o.status <> 'void';
      if prev_id is not null then
        posted := business_os.replace_source_observation(conn.enabled_by, prev_id, payload);
      else
        posted := business_os.post_source_observation(conn.enabled_by, payload);
      end if;
      update business_os.source_observations
      set source_record_id = payload ->> 'record_id'
      where id = (posted ->> 'observation_id')::uuid
        and source_record_id is null;
    else
      posted := business_os.post_source_observation(conn.enabled_by, payload);
      update business_os.source_observations
      set source_record_id = payload ->> 'record_id'
      where id = (posted ->> 'observation_id')::uuid
        and source_record_id is null;
    end if;
  end loop;

  update business_os.sync_cursors
  set cursor = case when has_more then page ->> 'next_cursor' else null end,
      phase = case when has_more then 'backfill' else 'incremental' end,
      snapshot_id = page ->> 'snapshot_id',
      high_watermark = page ->> 'high_watermark',
      query_sha256 = page ->> 'query_binding_sha256',
      checkpoint = case when has_more then checkpoint else page ->> 'checkpoint' end,
      covered_through = nullif(page ->> 'data_as_of', '')::timestamptz,
      last_committed_at = clock_timestamp()
  where connection_id = conn.id
    and sync_cursors.endpoint = endpoint;

  insert into business_os.sync_runs (
    organization_id, connection_id, endpoint, status, attempt, worker_id, finished_at
  ) values (
    conn.organization_id, conn.id, endpoint, 'committed', 1, worker_id, clock_timestamp()
  );
  perform business_os.finish_sync_lease(conn.id, worker_id, 'ok', null, null);
  return jsonb_build_object('committed', true);
end;
$fn$;

create function business_os.commit_snapshot_page(
  target uuid,
  worker_id text,
  page jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  conn business_os.source_connections%rowtype;
  slug text;
  endpoint text;
  has_more boolean;
  body jsonb;
begin
  if worker_id !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'worker_invalid' using errcode = '22023';
  end if;
  select * into conn
  from business_os.source_connections c
  where c.id = target
    and c.lease_owner = worker_id
    and c.lease_until > clock_timestamp()
  for update;
  if conn.id is null then
    raise exception 'lease_lost' using errcode = '42501';
  end if;

  endpoint := page ->> 'endpoint';
  body := page -> 'body';
  if endpoint is null or endpoint = 'finance/records' or not (endpoint = any (conn.enabled_datasets)) then
    raise exception 'dataset_invalid' using errcode = '22023';
  end if;
  if jsonb_typeof(body) <> 'object' or body ->> 'posting' is distinct from 'false' then
    raise exception 'summary_non_posting' using errcode = '22023';
  end if;
  select p.slug into slug from business_os.projects p where p.id = conn.project_id;
  if body ->> 'project_id' is distinct from slug
     or body ->> 'environment' is distinct from conn.source_environment then
    insert into business_os.import_quarantine (
      organization_id, connection_id, endpoint, reason, detail
    ) values (
      conn.organization_id, conn.id, endpoint, 'binding_error',
      case
        when body ->> 'project_id' is distinct from slug then 'project_mismatch'
        else 'environment_mismatch'
      end
    );
    insert into business_os.sync_runs (
      organization_id, connection_id, endpoint, status, attempt, error_code, error_detail, worker_id, finished_at
    ) values (
      conn.organization_id, conn.id, endpoint, 'quarantined', greatest(conn.failure_count + 1, 1),
      'quarantine', 'snapshot_binding', worker_id, clock_timestamp()
    );
    perform business_os.finish_sync_lease(conn.id, worker_id, 'degraded', 'quarantine', 3600);
    return jsonb_build_object('committed', false, 'quarantined', 1);
  end if;

  has_more := coalesce((page ->> 'has_more')::boolean, false);
  if has_more and nullif(page ->> 'next_cursor', '') is null then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  if not has_more then
    update business_os.imported_snapshots
    set status = 'retained'
    where connection_id = conn.id
      and dataset = endpoint
      and status = 'current'
      and snapshot_id is distinct from body ->> 'snapshot_id';

    insert into business_os.imported_snapshots (
      organization_id, connection_id, dataset, snapshot_id, body, grain, timezone, coverage,
      data_as_of, cutoff_from, cutoff_to, status
    ) values (
      conn.organization_id,
      conn.id,
      endpoint,
      body ->> 'snapshot_id',
      body,
      page ->> 'grain',
      page ->> 'timezone',
      page ->> 'coverage',
      nullif(body ->> 'data_as_of', '')::timestamptz,
      nullif(page ->> 'cutoff_from', '')::timestamptz,
      nullif(page ->> 'cutoff_to', '')::timestamptz,
      'current'
    )
    on conflict on constraint imported_snapshots_identity_key do update set
      body = excluded.body,
      grain = excluded.grain,
      timezone = excluded.timezone,
      coverage = excluded.coverage,
      data_as_of = excluded.data_as_of,
      cutoff_from = excluded.cutoff_from,
      cutoff_to = excluded.cutoff_to,
      status = 'current';
  end if;

  update business_os.sync_cursors
  set cursor = case when has_more then page ->> 'next_cursor' else null end,
      phase = case when has_more then 'backfill' else 'incremental' end,
      snapshot_id = body ->> 'snapshot_id',
      covered_through = nullif(body ->> 'data_as_of', '')::timestamptz,
      last_committed_at = clock_timestamp()
  where connection_id = conn.id
    and sync_cursors.endpoint = endpoint;

  insert into business_os.sync_runs (
    organization_id, connection_id, endpoint, status, attempt, worker_id, finished_at
  ) values (
    conn.organization_id, conn.id, endpoint, 'committed', 1, worker_id, clock_timestamp()
  );
  perform business_os.finish_sync_lease(conn.id, worker_id, 'ok', null, null);
  return jsonb_build_object('committed', true);
end;
$fn$;

create function business_os.begin_resync(target uuid, worker_id text, target_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  conn business_os.source_connections%rowtype;
  kept_from timestamptz;
  kept_to timestamptz;
begin
  if worker_id !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'worker_invalid' using errcode = '22023';
  end if;
  select * into conn
  from business_os.source_connections c
  where c.id = target
    and c.lease_owner = worker_id
    and c.lease_until > clock_timestamp()
  for update;
  if conn.id is null then
    raise exception 'lease_lost' using errcode = '42501';
  end if;

  update business_os.sync_cursors
  set cursor = null,
      phase = 'backfill',
      snapshot_id = null,
      high_watermark = null,
      query_sha256 = null,
      checkpoint = null
  where connection_id = conn.id
    and endpoint = target_endpoint
  returning initial_from, initial_to into kept_from, kept_to;
  if kept_from is null then
    raise exception 'dataset_invalid' using errcode = '22023';
  end if;

  insert into business_os.sync_runs (
    organization_id, connection_id, endpoint, status, attempt, error_code, error_detail, worker_id, finished_at
  ) values (
    conn.organization_id, conn.id, target_endpoint, 'resync', 1, 'cursor_expired',
    'drop_cursor_reuse_range', worker_id, clock_timestamp()
  );
  perform business_os.finish_sync_lease(conn.id, worker_id, 'degraded', 'cursor_expired', null);
  return jsonb_build_object(
    'resync', true,
    'initial_from', to_char(kept_from at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'initial_to', to_char(kept_to at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
end;
$fn$;

create function business_os.record_sync_failure(
  target uuid,
  worker_id text,
  target_endpoint text,
  error_code text,
  error_detail text,
  retry_seconds integer,
  mark_stale boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  conn business_os.source_connections%rowtype;
  health text;
begin
  if error_code !~ '^[a-z0-9_]{1,64}$' then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  if retry_seconds is null or retry_seconds < 1 or retry_seconds > 86400 then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  select * into conn
  from business_os.source_connections
  where id = target
  for update;
  if conn.id is null then
    raise exception 'connection_missing' using errcode = '22023';
  end if;

  if mark_stale then
    update business_os.imported_snapshots
    set status = 'stale'
    where connection_id = conn.id
      and dataset = target_endpoint
      and status = 'current';
  end if;

  health := case when mark_stale then 'outage' else 'degraded' end;
  insert into business_os.sync_runs (
    organization_id, connection_id, endpoint, status, attempt, error_code, error_detail, worker_id, finished_at
  ) values (
    conn.organization_id,
    conn.id,
    target_endpoint,
    'failed',
    greatest(conn.failure_count + 1, 1),
    error_code,
    left(coalesce(error_detail, ''), 200),
    worker_id,
    clock_timestamp()
  );
  perform business_os.finish_sync_lease(conn.id, worker_id, health, error_code, retry_seconds);
end;
$fn$;

alter table business_os.source_connections enable row level security;
alter table business_os.source_connections force row level security;
alter table business_os.sync_cursors enable row level security;
alter table business_os.sync_cursors force row level security;
alter table business_os.sync_runs enable row level security;
alter table business_os.sync_runs force row level security;
alter table business_os.import_quarantine enable row level security;
alter table business_os.import_quarantine force row level security;
alter table business_os.imported_snapshots enable row level security;
alter table business_os.imported_snapshots force row level security;
alter table business_os.source_health enable row level security;
alter table business_os.source_health force row level security;

create policy source_connections_select on business_os.source_connections
for select to authenticated using (business_os.is_active_member(organization_id));
create policy sync_cursors_select on business_os.sync_cursors
for select to authenticated using (business_os.is_active_member(organization_id));
create policy sync_runs_select on business_os.sync_runs
for select to authenticated using (business_os.is_active_member(organization_id));
create policy import_quarantine_select on business_os.import_quarantine
for select to authenticated using (business_os.is_active_member(organization_id));
create policy imported_snapshots_select on business_os.imported_snapshots
for select to authenticated using (business_os.is_active_member(organization_id));
create policy source_health_select on business_os.source_health
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on
  business_os.source_connections,
  business_os.sync_cursors,
  business_os.sync_runs,
  business_os.import_quarantine,
  business_os.imported_snapshots,
  business_os.source_health
from public, anon;
grant select on
  business_os.source_connections,
  business_os.sync_cursors,
  business_os.sync_runs,
  business_os.import_quarantine,
  business_os.imported_snapshots,
  business_os.source_health
to authenticated;
revoke insert, update, delete, truncate on
  business_os.source_connections,
  business_os.sync_cursors,
  business_os.sync_runs,
  business_os.import_quarantine,
  business_os.imported_snapshots,
  business_os.source_health
from public, anon, authenticated;

revoke all on function business_os.normalize_source_url(text) from public, anon, authenticated;
revoke all on function business_os.touch_source_health(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.register_source_connection(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function business_os.enable_source_connection(uuid, uuid, jsonb, text[], text, integer, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function business_os.claim_sync_lease(text, integer) from public, anon, authenticated;
revoke all on function business_os.finish_sync_lease(uuid, text, text, text, integer) from public, anon, authenticated;
revoke all on function business_os.commit_records_page(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function business_os.commit_snapshot_page(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function business_os.begin_resync(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.record_sync_failure(uuid, text, text, text, text, integer, boolean) from public, anon, authenticated;

grant execute on function business_os.register_source_connection(uuid, uuid, text, text, text, text) to service_role;
grant execute on function business_os.enable_source_connection(uuid, uuid, jsonb, text[], text, integer, timestamptz, timestamptz) to service_role;
grant execute on function business_os.claim_sync_lease(text, integer) to service_role;
grant execute on function business_os.commit_records_page(uuid, text, jsonb) to service_role;
grant execute on function business_os.commit_snapshot_page(uuid, text, jsonb) to service_role;
grant execute on function business_os.begin_resync(uuid, text, text) to service_role;
grant execute on function business_os.record_sync_failure(uuid, text, text, text, text, integer, boolean) to service_role;
