-- M1 identity foundation.
-- Recovery before later migrations: drop schema business_os cascade and remove
-- bucket business-os-private plus policy business_os_private_deny.
-- Never apply this file to the marketing database.

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
end
$guard$;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$roles$;

create schema if not exists business_os;
revoke all on schema business_os from public, anon;
grant usage on schema business_os to authenticated, service_role;

create table business_os.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  reporting_currency text not null default 'GBP' check (reporting_currency ~ '^[A-Z]{3}$'),
  timezone text not null,
  created_at timestamptz not null default now()
);

create table business_os.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('owner', 'admin', 'read_only')),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table business_os.telegram_identities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  user_id uuid not null references auth.users (id),
  bot_id text not null,
  telegram_user_id bigint not null check (telegram_user_id > 0),
  telegram_username text,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index telegram_identities_active_bot_user_idx
  on business_os.telegram_identities (bot_id, telegram_user_id)
  where revoked_at is null;

create table business_os.telegram_link_challenges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  user_id uuid not null references auth.users (id),
  token_hash text not null unique,
  bound_session_id text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table business_os.telegram_exchanges (
  init_data_hash text primary key,
  organization_id uuid not null references business_os.organizations (id),
  user_id uuid not null references auth.users (id),
  session_id text not null,
  consumed_at timestamptz not null default now()
);

create table business_os.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  slug text not null,
  name text not null,
  state text not null default 'unverified' check (state in ('unverified', 'verified')),
  website text,
  reporting_enabled boolean not null default false,
  integration_verified_at timestamptz,
  unique (organization_id, slug),
  check (reporting_enabled = false or state = 'verified')
);

create table business_os.integration_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  provider text not null check (char_length(provider) between 1 and 64),
  environment text not null check (environment in ('local', 'staging', 'production')),
  secret_reference text not null check (secret_reference ~ '^[A-Z][A-Z0-9_]{2,64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, provider, environment)
);

create table business_os.identity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  actor_user_id uuid,
  action text not null,
  subject text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index memberships_active_user_idx
  on business_os.memberships (user_id)
  where revoked_at is null;

create index memberships_organization_idx
  on business_os.memberships (organization_id);

create index telegram_identities_user_idx
  on business_os.telegram_identities (user_id);

create index telegram_link_challenges_user_idx
  on business_os.telegram_link_challenges (user_id);

create index identity_events_organization_idx
  on business_os.identity_events (organization_id, created_at);

with org as (
  insert into business_os.organizations (slug, legal_name, reporting_currency, timezone)
  values ('simnetiq', 'Simnetiq Ltd', 'GBP', 'Europe/London')
  returning id
)
insert into business_os.projects (organization_id, slug, name, state, reporting_enabled)
select org.id, seed.slug, seed.name, 'unverified', false
from org
cross join (
  values
    ('doppler', 'Doppler'),
    ('smscode', 'SMS Code')
) as seed(slug, name);

create function business_os.is_active_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from business_os.memberships m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.revoked_at is null
  );
$fn$;

alter table business_os.organizations enable row level security;
alter table business_os.organizations force row level security;
alter table business_os.memberships enable row level security;
alter table business_os.memberships force row level security;
alter table business_os.telegram_identities enable row level security;
alter table business_os.telegram_identities force row level security;
alter table business_os.telegram_link_challenges enable row level security;
alter table business_os.telegram_link_challenges force row level security;
alter table business_os.telegram_exchanges enable row level security;
alter table business_os.telegram_exchanges force row level security;
alter table business_os.projects enable row level security;
alter table business_os.projects force row level security;
alter table business_os.integration_configs enable row level security;
alter table business_os.integration_configs force row level security;
alter table business_os.identity_events enable row level security;
alter table business_os.identity_events force row level security;

create policy organizations_select on business_os.organizations
for select to authenticated
using (business_os.is_active_member(id));

create policy memberships_select on business_os.memberships
for select to authenticated
using (business_os.is_active_member(organization_id));

create policy projects_select on business_os.projects
for select to authenticated
using (business_os.is_active_member(organization_id));

create policy integration_configs_select on business_os.integration_configs
for select to authenticated
using (business_os.is_active_member(organization_id));

create policy identity_events_select on business_os.identity_events
for select to authenticated
using (business_os.is_active_member(organization_id));

create policy telegram_identities_select on business_os.telegram_identities
for select to authenticated
using (business_os.is_active_member(organization_id));

create policy telegram_link_challenges_select on business_os.telegram_link_challenges
for select to authenticated
using (user_id = (select auth.uid()) and business_os.is_active_member(organization_id));

create policy telegram_exchanges_select on business_os.telegram_exchanges
for select to authenticated
using (user_id = (select auth.uid()) and business_os.is_active_member(organization_id));

revoke all on all tables in schema business_os from public, anon;
grant select on all tables in schema business_os to authenticated;
revoke insert, update, delete, truncate on all tables in schema business_os from authenticated;

create function business_os.grant_owner(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  membership_id uuid;
begin
  if exists (
    select 1
    from business_os.memberships m
    where m.role = 'owner'
      and m.revoked_at is null
  ) then
    raise exception 'owner_exists' using errcode = '42501';
  end if;

  select o.id into org_id
  from business_os.organizations o
  where o.slug = 'simnetiq';

  if org_id is null then
    raise exception 'organization_missing' using errcode = 'P0001';
  end if;

  insert into business_os.memberships (organization_id, user_id, role)
  values (org_id, target_user, 'owner')
  returning id into membership_id;

  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (org_id, target_user, 'grant_owner', target_user::text);

  return membership_id;
end;
$fn$;

create function business_os.create_link_challenge(
  actor_id uuid,
  token_hash text,
  bound_session_id text,
  expires_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  challenge_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null
  limit 1;

  if org_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  if expires_at <= clock_timestamp()
     or expires_at > clock_timestamp() + interval '6 minutes' then
    raise exception 'challenge_expiry' using errcode = '22023';
  end if;

  insert into business_os.telegram_link_challenges (
    organization_id, user_id, token_hash, bound_session_id, expires_at
  ) values (
    org_id, actor_id, token_hash, bound_session_id, expires_at
  ) returning id into challenge_id;

  return challenge_id;
end;
$fn$;

create function business_os.consume_link_challenge(
  actor_id uuid,
  challenge_id uuid,
  token_hash text,
  bound_session_id text,
  bot_id text,
  telegram_user_id bigint,
  telegram_username text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  identity_id uuid;
  stored_username text;
begin
  select c.organization_id into org_id
  from business_os.telegram_link_challenges c
  where c.id = challenge_id
    and c.user_id = actor_id
    and c.token_hash = consume_link_challenge.token_hash
    and c.bound_session_id = consume_link_challenge.bound_session_id
    and c.consumed_at is null
    and c.expires_at > clock_timestamp()
  for update;

  if org_id is null then
    raise exception 'challenge_invalid' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from business_os.memberships m
    where m.user_id = actor_id
      and m.organization_id = org_id
      and m.role = 'owner'
      and m.revoked_at is null
  ) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  update business_os.telegram_link_challenges
  set consumed_at = clock_timestamp()
  where id = challenge_id
    and consumed_at is null;

  if not found then
    raise exception 'challenge_invalid' using errcode = '42501';
  end if;

  stored_username := nullif(telegram_username, '');

  insert into business_os.telegram_identities (
    organization_id, user_id, bot_id, telegram_user_id, telegram_username
  ) values (
    org_id,
    actor_id,
    consume_link_challenge.bot_id,
    consume_link_challenge.telegram_user_id,
    stored_username
  ) returning id into identity_id;

  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'telegram_link', telegram_user_id::text);

  return identity_id;
end;
$fn$;

create function business_os.consume_init_data(
  actor_id uuid,
  init_data_hash text,
  session_id text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  existing_session text;
  existing_user uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.revoked_at is null
  limit 1;

  if org_id is null then
    raise exception 'membership_inactive' using errcode = '42501';
  end if;

  select e.session_id, e.user_id
    into existing_session, existing_user
  from business_os.telegram_exchanges e
  where e.init_data_hash = consume_init_data.init_data_hash;

  if found then
    if existing_session = consume_init_data.session_id and existing_user = actor_id then
      return actor_id;
    end if;
    raise exception 'replayed_init_data' using errcode = '42501';
  end if;

  begin
    insert into business_os.telegram_exchanges (
      init_data_hash, organization_id, user_id, session_id
    ) values (
      consume_init_data.init_data_hash, org_id, actor_id, consume_init_data.session_id
    );
  exception
    when unique_violation then
      select e.session_id, e.user_id
        into existing_session, existing_user
      from business_os.telegram_exchanges e
      where e.init_data_hash = consume_init_data.init_data_hash;

      if existing_session = consume_init_data.session_id and existing_user = actor_id then
        return actor_id;
      end if;
      raise exception 'replayed_init_data' using errcode = '42501';
  end;

  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'telegram_exchange', consume_init_data.init_data_hash);

  return actor_id;
end;
$fn$;

create function business_os.resolve_telegram_member(
  lookup_bot_id text,
  lookup_telegram_user_id bigint
) returns uuid
language sql
stable
security definer
set search_path = ''
as $fn$
  select ti.user_id
  from business_os.telegram_identities ti
  join business_os.memberships m
    on m.user_id = ti.user_id
   and m.organization_id = ti.organization_id
   and m.revoked_at is null
  where ti.bot_id = lookup_bot_id
    and ti.telegram_user_id = lookup_telegram_user_id
    and ti.revoked_at is null
  limit 1
$fn$;

create function business_os.revoke_membership(
  actor_id uuid,
  membership_id uuid,
  reason text
) returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor_org uuid;
  target_org uuid;
  target_role text;
  target_user uuid;
  active_owners integer;
begin
  if reason is null or char_length(btrim(reason)) = 0 then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  select m.organization_id into actor_org
  from business_os.memberships m
  where m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null
  limit 1;

  if actor_org is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  select m.organization_id, m.role, m.user_id
    into target_org, target_role, target_user
  from business_os.memberships m
  where m.id = membership_id
    and m.revoked_at is null
  for update;

  if target_org is null or target_org <> actor_org then
    raise exception 'membership_missing' using errcode = '42501';
  end if;

  if target_role = 'owner' then
    select count(*) into active_owners
    from business_os.memberships m
    where m.organization_id = actor_org
      and m.role = 'owner'
      and m.revoked_at is null;

    if active_owners <= 1 then
      raise exception 'last_owner' using errcode = '42501';
    end if;
  end if;

  update business_os.memberships
  set revoked_at = clock_timestamp(), updated_at = clock_timestamp()
  where id = membership_id
    and revoked_at is null;

  insert into business_os.identity_events (
    organization_id, actor_user_id, action, subject, reason
  ) values (
    actor_org, actor_id, 'revoke_membership', target_user::text, btrim(reason)
  );
end;
$fn$;

create function business_os.upsert_integration_config(
  actor_id uuid,
  target_project_id uuid,
  target_provider text,
  target_environment text,
  target_secret_reference text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  config_id uuid;
begin
  if target_secret_reference !~ '^[A-Z][A-Z0-9_]{2,64}$' then
    raise exception 'secret_reference_invalid' using errcode = '22023';
  end if;

  if target_environment not in ('local', 'staging', 'production') then
    raise exception 'environment_invalid' using errcode = '22023';
  end if;

  if target_provider is null or char_length(target_provider) < 1 or char_length(target_provider) > 64 then
    raise exception 'provider_invalid' using errcode = '22023';
  end if;

  select p.organization_id into org_id
  from business_os.projects p
  join business_os.memberships m
    on m.organization_id = p.organization_id
  where p.id = target_project_id
    and m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null;

  if org_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  insert into business_os.integration_configs (
    organization_id, project_id, provider, environment, secret_reference
  ) values (
    org_id,
    target_project_id,
    target_provider,
    target_environment,
    target_secret_reference
  )
  on conflict (project_id, provider, environment)
  do update set
    secret_reference = excluded.secret_reference,
    updated_at = clock_timestamp()
  returning id into config_id;

  insert into business_os.identity_events (organization_id, actor_user_id, action, subject)
  values (
    org_id,
    actor_id,
    'upsert_integration_config',
    target_provider || ':' || target_environment
  );

  return config_id;
end;
$fn$;

revoke all on function business_os.is_active_member(uuid) from public, anon;
grant execute on function business_os.is_active_member(uuid) to authenticated;

revoke all on function business_os.grant_owner(uuid) from public, anon, authenticated;
revoke all on function business_os.create_link_challenge(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function business_os.consume_link_challenge(uuid, uuid, text, text, text, bigint, text) from public, anon, authenticated;
revoke all on function business_os.consume_init_data(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.resolve_telegram_member(text, bigint) from public, anon, authenticated;
revoke all on function business_os.revoke_membership(uuid, uuid, text) from public, anon, authenticated;
revoke all on function business_os.upsert_integration_config(uuid, uuid, text, text, text) from public, anon, authenticated;

grant execute on function business_os.grant_owner(uuid) to service_role;
grant execute on function business_os.create_link_challenge(uuid, text, text, timestamptz) to service_role;
grant execute on function business_os.consume_link_challenge(uuid, uuid, text, text, text, bigint, text) to service_role;
grant execute on function business_os.consume_init_data(uuid, text, text) to service_role;
grant execute on function business_os.resolve_telegram_member(text, bigint) to service_role;
grant execute on function business_os.revoke_membership(uuid, uuid, text) to service_role;
grant execute on function business_os.upsert_integration_config(uuid, uuid, text, text, text) to service_role;

do $storage$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage'
      and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('business-os-private', 'business-os-private', false)
    on conflict (id) do nothing;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and pg_catalog.pg_get_userbyid(c.relowner) = current_user
  ) then
    execute 'alter table storage.objects enable row level security';
    execute $policy$
      create policy business_os_private_deny on storage.objects
      as restrictive
      for all
      to anon, authenticated
      using (bucket_id is distinct from 'business-os-private')
      with check (bucket_id is distinct from 'business-os-private')
    $policy$;
  end if;
end
$storage$;
