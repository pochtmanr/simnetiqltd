-- Sync history grows without bound: every pass stores a new copy of each dataset
-- and marks the old one 'retained', and every tick writes run rows. Reports read
-- only the 'current' copy, so superseded copies and old run rows can go.
-- Sales records, the ledger, quarantine and the current copy of every dataset
-- are never touched.

create index sync_runs_started_idx on business_os.sync_runs (started_at);
create index imported_snapshots_retained_idx
  on business_os.imported_snapshots (created_at)
  where status = 'retained';

create function business_os.prune_sync_history(keep_days integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  cutoff timestamptz;
  snapshots integer;
  runs integer;
begin
  if keep_days is null or keep_days < 7 or keep_days > 3650 then
    raise exception 'retention_invalid' using errcode = '22023';
  end if;
  cutoff := clock_timestamp() - make_interval(days => keep_days);

  delete from business_os.imported_snapshots
  where status = 'retained'
    and created_at < cutoff;
  get diagnostics snapshots = row_count;

  delete from business_os.sync_runs
  where started_at < cutoff;
  get diagnostics runs = row_count;

  return jsonb_build_object('snapshots', snapshots, 'runs', runs);
end;
$fn$;

revoke all on function business_os.prune_sync_history(integer) from public, anon, authenticated;
grant execute on function business_os.prune_sync_history(integer) to service_role;
