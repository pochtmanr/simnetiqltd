-- Report coverage could never read "complete": the last step overwrote it with
-- "partial" whenever any row was observed. Now it is "missing" with no rows,
-- "partial" when a project is left out or a bucket is incomplete, else "complete".
-- The function body is otherwise unchanged from 20260929210000_reconciliation.sql.

create or replace function business_os.financial_report(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  project uuid;
  drill text;
  basis text;
  grain text;
  from_ts timestamptz;
  to_ts timestamptz;
  snapshot_id text;
  data_as_of timestamptz;
  exclusions jsonb := '[]'::jsonb;
  buckets jsonb := '[]'::jsonb;
  cursor timestamptz;
  limit_start timestamptz;
  natural_end timestamptz;
  clip_from timestamptz;
  clip_to timestamptz;
  partial boolean;
  coverage text := 'complete';
  proj record;
  row_count integer;
  other_count integer;
  section_native jsonb;
  observed integer;
begin
  org_id := business_os.assert_finance_reader(actor_id);
  basis := payload ->> 'basis';
  grain := payload ->> 'grain';
  if basis not in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  if grain not in ('custom', 'month', 'year') then
    raise exception 'grain_invalid' using errcode = '22023';
  end if;
  begin
    from_ts := (payload ->> 'from')::timestamptz;
    to_ts := (payload ->> 'to')::timestamptz;
  exception
    when others then
      raise exception 'period_invalid' using errcode = '22023';
  end;
  if from_ts is null or to_ts is null or to_ts <= from_ts then
    raise exception 'period_invalid' using errcode = '22023';
  end if;
  if to_ts - from_ts > interval '366 days' then
    raise exception 'interval_too_large' using errcode = '22023';
  end if;

  if nullif(payload ->> 'project_slug', '') is not null then
    select p.id, p.slug into project, drill
    from business_os.projects p
    where p.organization_id = org_id
      and p.slug = payload ->> 'project_slug';
    if project is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  else
    select p.slug into drill
    from business_os.projects p
    where p.organization_id = org_id
      and exists (
        select 1
        from business_os.report_observations(org_id, p.id, from_ts, to_ts, basis) o
      )
    order by p.slug
    limit 1;
    drill := coalesce(drill, 'doppler');
  end if;

  select s.snapshot_id, s.data_as_of
    into snapshot_id, data_as_of
  from business_os.imported_snapshots s
  join business_os.source_connections c on c.id = s.connection_id
  where s.organization_id = org_id
    and s.dataset = 'finance/summary'
    and s.status = 'current'
    and s.cutoff_from = from_ts
    and s.cutoff_to = to_ts
    and (project is null or c.project_id = project)
  order by s.created_at desc
  limit 1;
  snapshot_id := coalesce(snapshot_id, 'central-unverified');

  for proj in
    select p.id, p.slug, p.reporting_enabled
    from business_os.projects p
    where p.organization_id = org_id
      and (project is null or p.id = project)
  loop
    select count(*)::integer into row_count
    from business_os.report_observations(org_id, proj.id, from_ts, to_ts, basis);
    if row_count = 0 then
      select count(*)::integer into other_count
      from business_os.source_observations o
      where o.project_id = proj.id
        and o.occurred_at >= from_ts
        and o.occurred_at < to_ts
        and o.recognition_basis <> basis
        and o.posting_role = 'primary'
        and o.status <> 'void';
      exclusions := exclusions || jsonb_build_array(jsonb_build_object(
        'project_slug', proj.slug,
        'reason', case when other_count > 0 then 'other_basis_present' else 'no_rows_for_basis' end,
        'included', false
      ));
    elsif not proj.reporting_enabled then
      exclusions := exclusions || jsonb_build_array(jsonb_build_object(
        'project_slug', proj.slug,
        'reason', 'reporting_disabled',
        'included', true
      ));
    end if;
  end loop;

  if grain = 'custom' then
    cursor := from_ts;
    limit_start := from_ts;
  else
    cursor := business_os.london_bucket_start(from_ts, grain);
    limit_start := business_os.london_bucket_start(to_ts - interval '1 microsecond', grain);
  end if;

  while cursor <= limit_start loop
    if grain = 'custom' then
      clip_from := from_ts;
      clip_to := to_ts;
      partial := false;
      natural_end := to_ts;
    else
      natural_end := timezone(
        'Europe/London',
        date_trunc(grain, timezone('Europe/London', cursor)) + case grain when 'year' then interval '1 year' else interval '1 month' end
      );
      clip_from := greatest(cursor, from_ts);
      clip_to := least(natural_end, to_ts);
      partial := clip_from > cursor or clip_to < natural_end;
    end if;
    if data_as_of is not null and data_as_of < clip_to then
      partial := true;
    end if;
    section_native := business_os.native_subtotals(org_id, project, drill, clip_from, clip_to, basis, snapshot_id);
    buckets := buckets || jsonb_build_array(jsonb_build_object(
      'from', business_os.utc_instant(clip_from),
      'to', business_os.utc_instant(clip_to),
      'partial', partial,
      'native_currency_subtotals', section_native,
      'gbp', business_os.gbp_block(org_id, project, drill, clip_from, clip_to, basis, snapshot_id),
      'allocation', business_os.allocation_block(org_id, project, clip_from, clip_to),
      'cash', business_os.cash_block(org_id, project, clip_from, clip_to, basis),
      'legacy_bridge', business_os.legacy_bridge(org_id, project, clip_from, clip_to, basis)
    ));
    if partial then
      coverage := 'partial';
    end if;
    exit when grain = 'custom';
    cursor := natural_end;
  end loop;

  select count(*)::integer into observed
  from business_os.report_observations(org_id, project, from_ts, to_ts, basis);
  if observed = 0 then
    coverage := 'missing';
  elsif exists (
    select 1 from jsonb_array_elements(exclusions) as item(value)
    where (item.value ->> 'included')::boolean = false
  ) then
    coverage := 'partial';
  end if;

  return jsonb_build_object(
    'basis', basis,
    'grain', grain,
    'coverage', coverage,
    'exclusions', exclusions,
    'buckets', buckets
  );
end;
$fn$;
