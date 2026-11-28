-- A dataset that spans several pages kept flipping back to 'backfill' while it
-- was being paged, so its next page asked for the backfill window with a cursor
-- bound to the current-month window and the source refused it. The phase now
-- only moves forward, when the last page of a pass is committed. A resync still
-- sets it back explicitly. The body is otherwise unchanged from
-- 20260929180000_project_pulls.sql.

create or replace function business_os.commit_snapshot_page(
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
      phase = case when has_more then phase else 'incremental' end,
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
