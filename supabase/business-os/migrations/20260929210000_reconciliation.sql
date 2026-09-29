-- M4 shadow reconciliation. Additive after 20260929180000_project_pulls.sql.
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
  if to_regclass('business_os.imported_snapshots') is null then
    raise exception 'project_pulls_missing';
  end if;
end
$guard$;

alter table business_os.source_observations
  add column source_system text,
  add column channel text,
  add column store text,
  add column processor text;

alter table business_os.source_observations
  add constraint source_observations_source_system_len
  check (source_system is null or char_length(source_system) between 1 and 80),
  add constraint source_observations_channel_len
  check (channel is null or char_length(channel) between 1 and 80),
  add constraint source_observations_store_len
  check (store is null or char_length(store) between 1 and 80),
  add constraint source_observations_processor_len
  check (processor is null or char_length(processor) between 1 and 80);

create index source_observations_report_idx
  on business_os.source_observations (organization_id, project_id, recognition_basis, occurred_at)
  where posting_role = 'primary' and status <> 'void';

create table business_os.observation_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  environment text not null check (environment in ('local', 'staging', 'production')),
  observation_id uuid not null references business_os.source_observations (id),
  component_id text not null,
  component_type text not null check (component_type in (
    'processor_fee', 'store_commission', 'sales_tax', 'network_fee', 'fee_reversal', 'tax_reversal'
  )),
  amount numeric,
  currency text,
  quality text not null check (quality in ('actual', 'estimated', 'legacy_derived', 'unavailable')),
  reason text,
  posting_role text not null check (posting_role in ('primary', 'alias')),
  created_at timestamptz not null default now(),
  unique (observation_id, component_id),
  check (char_length(component_id) between 1 and 128),
  check (amount is null or amount >= 0),
  check (
    (quality = 'unavailable' and amount is null and reason is not null)
    or (quality <> 'unavailable' and amount is not null and currency is not null)
  )
);

create unique index observation_components_primary_idx
  on business_os.observation_components (project_id, environment, component_id)
  where posting_role = 'primary';

create index observation_components_observation_idx
  on business_os.observation_components (observation_id);

create table business_os.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  dataset text not null,
  basis text not null check (basis in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy')),
  formula_version text,
  fx_policy_version text,
  window_from timestamptz not null,
  window_to timestamptz not null,
  compared text[] not null,
  status text not null check (status in ('match', 'mismatch', 'incomplete')),
  evidence_kind text not null check (evidence_kind in ('synthetic', 'redacted_real', 'live')),
  native_result jsonb not null default '{}'::jsonb,
  gbp_result jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null,
  created_at timestamptz not null default now(),
  check (window_from < window_to),
  check (dataset in (
    'finance/records', 'finance/summary', 'finance/balances', 'finance/reconciliation'
  ))
);

create index reconciliation_runs_window_idx
  on business_os.reconciliation_runs (organization_id, project_id, window_from, window_to);

create table business_os.reconciliation_residuals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  run_id uuid not null references business_os.reconciliation_runs (id),
  code text not null check (code ~ '^[a-z0-9_]{1,80}$'),
  amount numeric,
  currency text,
  quality text not null check (quality in ('actual', 'estimated', 'legacy_derived', 'unavailable')),
  reason text,
  created_at timestamptz not null default now(),
  check (amount is null or amount >= 0),
  check (quality <> 'unavailable' or (amount is null and reason is not null))
);

create index reconciliation_residuals_run_idx
  on business_os.reconciliation_residuals (run_id, code);

create table business_os.dataset_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  dataset text not null check (dataset in (
    'finance/records', 'finance/summary', 'finance/balances', 'finance/reconciliation'
  )),
  basis text not null check (basis in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy')),
  state text not null default 'unverified' check (state in ('unverified', 'verified')),
  evidence_run_id uuid references business_os.reconciliation_runs (id),
  verified_at timestamptz,
  unique (project_id, dataset, basis),
  check (state = 'unverified' or (evidence_run_id is not null and verified_at is not null))
);

create table business_os.settlement_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  settlement_id uuid not null references business_os.settlements (id),
  observation_id uuid not null references business_os.source_observations (id),
  amount numeric not null check (amount >= 0),
  residual numeric check (residual is null or residual >= 0),
  created_at timestamptz not null default now(),
  unique (settlement_id, observation_id)
);

insert into business_os.dataset_verifications (organization_id, project_id, dataset, basis)
select p.organization_id, p.id, dataset.name, basis.name
from business_os.projects p
cross join (
  values ('finance/records'), ('finance/summary'), ('finance/balances'), ('finance/reconciliation')
) as dataset(name)
cross join (
  values ('purchase'), ('earned_management'), ('settled_cash'), ('sms_legacy')
) as basis(name)
where p.slug in ('doppler', 'smscode');

create function business_os.optional_label(raw text)
returns text
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;
  if char_length(raw) > 80 then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  return raw;
end;
$fn$;

create function business_os.assert_finance_reader(actor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.role in ('owner', 'admin', 'read_only')
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'reader_forbidden' using errcode = '42501';
  end if;
  return org_id;
end;
$fn$;

create function business_os.insert_observation_components(
  org_id uuid,
  project uuid,
  environment text,
  obs_id uuid,
  payload jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  item jsonb;
  component_amount numeric;
  component_currency text;
  component_quality text;
  component_reason text;
  component_role text;
begin
  if payload -> 'components' is null then
    return;
  end if;
  if jsonb_typeof(payload -> 'components') <> 'array' then
    raise exception 'inconsistent_record' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(payload -> 'components') as component(value)
  loop
    if item ->> 'component_id' is null or item ->> 'component_type' not in (
      'processor_fee', 'store_commission', 'sales_tax', 'network_fee', 'fee_reversal', 'tax_reversal'
    ) then
      raise exception 'inconsistent_record' using errcode = '22023';
    end if;
    component_role := coalesce(item ->> 'posting_role', 'primary');
    if component_role not in ('primary', 'alias') then
      raise exception 'inconsistent_record' using errcode = '22023';
    end if;
    if jsonb_typeof(item -> 'amount' -> 'amount') = 'number' then
      raise exception 'amount_invalid' using errcode = '22023';
    end if;
    component_quality := coalesce(item -> 'amount' ->> 'quality', item ->> 'quality');
    if component_quality not in ('actual', 'estimated', 'legacy_derived', 'unavailable') then
      raise exception 'amount_invalid' using errcode = '22023';
    end if;
    component_reason := nullif(coalesce(item -> 'amount' ->> 'reason', item ->> 'reason'), '');
    component_currency := nullif(item -> 'amount' ->> 'currency', '');
    if item -> 'amount' ->> 'amount' is null then
      component_amount := null;
      if component_quality <> 'unavailable' or component_reason is null then
        raise exception 'amount_reason_required' using errcode = '22023';
      end if;
    else
      component_amount := business_os.parse_amount(item -> 'amount' ->> 'amount', component_currency, null, null);
      if component_quality = 'unavailable' then
        raise exception 'amount_invalid' using errcode = '22023';
      end if;
    end if;
    insert into business_os.observation_components (
      organization_id, project_id, environment, observation_id, component_id, component_type,
      amount, currency, quality, reason, posting_role
    ) values (
      org_id, project, environment, obs_id, item ->> 'component_id', item ->> 'component_type',
      component_amount, component_currency, component_quality, component_reason, component_role
    );
  end loop;
end;
$fn$;

create function business_os.report_observations(
  p_org uuid,
  p_project uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text
) returns setof business_os.source_observations
language sql
stable
security definer
set search_path = ''
as $fn$
  select o.*
  from business_os.source_observations o
  where o.organization_id = p_org
    and (p_project is null or o.project_id = p_project)
    and o.recognition_basis = p_basis
    and o.posting_role = 'primary'
    and o.observation_kind = 'record'
    and o.status in ('posted', 'pending', 'observed')
    and o.occurred_at >= p_from
    and o.occurred_at < p_to
    and not exists (
      select 1
      from business_os.financial_entries e
      where e.source_observation_id = o.id
        and e.reversal_of is null
        and e.kind <> 'reversal'
        and e.status = 'reversed'
    );
$fn$;

create function business_os.utc_instant(instant timestamptz)
returns text
language sql
stable
set search_path = ''
as $fn$
  select to_char(instant at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
$fn$;

create function business_os.report_metric(
  amount numeric,
  currency text,
  quality text,
  reason text,
  coverage text,
  drill_project text,
  from_ts timestamptz,
  to_ts timestamptz,
  basis text,
  record_types jsonb,
  snapshot_id text
) returns jsonb
language sql
stable
set search_path = ''
as $fn$
  select jsonb_strip_nulls(jsonb_build_object(
    'amount', business_os.money_text(amount),
    'currency', currency,
    'quality', quality,
    'reason', reason,
    'coverage', coverage,
    'drill_through', jsonb_build_object(
      'dataset', 'finance.records',
      'snapshot_id', coalesce(snapshot_id, 'central-unverified'),
      'filter', jsonb_build_object(
        'project_id', drill_project,
        'from', business_os.utc_instant(from_ts),
        'to', business_os.utc_instant(to_ts),
        'basis', basis,
        'record_types', record_types
      )
    )
  )) || jsonb_build_object('amount', business_os.money_text(amount));
$fn$;

create function business_os.derive_metrics(
  p_currency text,
  p_gross numeric,
  p_gross_count integer,
  p_refund numeric,
  p_refund_count integer,
  p_tax numeric,
  p_tax_count integer,
  p_tax_quality text,
  p_fee numeric,
  p_fee_count integer,
  p_fee_quality text,
  p_cost numeric,
  p_cost_count integer,
  p_cost_quality text,
  p_opex numeric,
  p_basis text,
  p_drill text,
  p_from timestamptz,
  p_to timestamptz,
  p_snapshot text
) returns jsonb
language plpgsql
stable
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  scale integer;
  gross_amount numeric;
  refund_amount numeric;
  tax_amount numeric;
  fee_amount numeric;
  cost_amount numeric;
  opex_amount numeric;
  net_sales numeric;
  proceeds numeric;
  contribution numeric;
  operating numeric;
  gross_quality text;
  refund_quality text;
  tax_quality text;
  fee_quality text;
  cost_quality text;
  gross_reason text;
  refund_reason text;
  tax_reason text;
  fee_reason text;
  cost_reason text;
  gross_coverage text;
  refund_coverage text;
  tax_coverage text;
  fee_coverage text;
  cost_coverage text;
  sales_reason text;
  margin numeric;
begin
  scale := coalesce(business_os.fiat_scale(p_currency), 2);
  if p_gross_count = 0 then
    gross_amount := null;
    gross_quality := 'unavailable';
    gross_reason := 'no_sale_evidence';
    gross_coverage := 'missing';
  else
    gross_amount := round(p_gross, scale);
    gross_quality := 'actual';
    gross_reason := null;
    gross_coverage := 'complete';
  end if;

  if p_basis = 'sms_legacy' then
    refund_amount := null;
    refund_quality := 'unavailable';
    refund_reason := 'legacy_refunds_are_not_gross_principal';
    refund_coverage := 'missing';
  elsif p_refund_count = 0 and p_gross_count > 0 then
    refund_amount := 0;
    refund_quality := 'actual';
    refund_reason := null;
    refund_coverage := 'complete';
  elsif p_refund_count = 0 then
    refund_amount := null;
    refund_quality := 'unavailable';
    refund_reason := 'no_sale_evidence';
    refund_coverage := 'missing';
  else
    refund_amount := round(p_refund, scale);
    refund_quality := 'actual';
    refund_reason := null;
    refund_coverage := 'complete';
  end if;

  if p_tax_count = 0 or p_tax_quality = 'unavailable' or p_tax is null then
    tax_amount := null;
    tax_quality := 'unavailable';
    tax_reason := 'missing_sales_tax';
    tax_coverage := 'missing';
  elsif p_tax < 0 then
    tax_amount := null;
    tax_quality := 'unavailable';
    tax_reason := 'tax_reversal_exceeds_tax';
    tax_coverage := 'missing';
  else
    tax_amount := round(p_tax, scale);
    tax_quality := p_tax_quality;
    tax_reason := case when p_tax_quality = 'actual' then null else 'estimated_component' end;
    tax_coverage := case when p_tax_quality = 'actual' then 'complete' else 'partial' end;
  end if;

  if p_fee_count = 0 or p_fee_quality = 'unavailable' or p_fee is null then
    fee_amount := null;
    fee_quality := 'unavailable';
    fee_reason := 'missing_fee_components';
    fee_coverage := 'missing';
  elsif p_fee < 0 then
    fee_amount := null;
    fee_quality := 'unavailable';
    fee_reason := 'fee_reversal_exceeds_fees';
    fee_coverage := 'missing';
  else
    fee_amount := round(p_fee, scale);
    fee_quality := p_fee_quality;
    fee_reason := case when p_fee_quality = 'actual' then null else 'estimated_component' end;
    fee_coverage := case when p_fee_quality = 'actual' then 'complete' else 'partial' end;
  end if;

  if p_cost_count = 0 or p_cost_quality = 'unavailable' or p_cost is null then
    cost_amount := null;
    cost_quality := 'unavailable';
    cost_reason := 'missing_direct_costs';
    cost_coverage := 'missing';
  else
    cost_amount := round(p_cost, scale);
    cost_quality := p_cost_quality;
    cost_reason := case when p_cost_quality = 'actual' then null else 'estimated_component' end;
    cost_coverage := case when p_cost_quality = 'actual' then 'complete' else 'partial' end;
  end if;

  opex_amount := round(coalesce(p_opex, 0), scale);

  if gross_quality = 'actual' and refund_quality = 'actual' and tax_quality = 'actual' then
    net_sales := round(gross_amount - refund_amount - tax_amount, scale);
    sales_reason := null;
  else
    net_sales := null;
    sales_reason := case
      when tax_quality <> 'actual' then 'missing_sales_tax'
      else 'incomplete_net_sales'
    end;
  end if;

  if net_sales is not null and fee_quality = 'actual' then
    proceeds := round(net_sales - fee_amount, scale);
  else
    proceeds := null;
  end if;

  if proceeds is not null and cost_quality = 'actual' then
    contribution := round(proceeds - cost_amount, scale);
  else
    contribution := null;
  end if;

  if contribution is not null then
    operating := round(contribution - opex_amount, scale);
  else
    operating := null;
  end if;

  if net_sales is not null and net_sales > 0 and operating is not null then
    margin := round(operating / net_sales, 4);
  else
    margin := null;
  end if;

  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'gross_customer_sales', business_os.report_metric(gross_amount, p_currency, gross_quality, gross_reason, gross_coverage, p_drill, p_from, p_to, p_basis, '["sale"]'::jsonb, p_snapshot),
      'refunded_principal', business_os.report_metric(refund_amount, p_currency, refund_quality, refund_reason, refund_coverage, p_drill, p_from, p_to, p_basis, '["refund","chargeback"]'::jsonb, p_snapshot),
      'sales_tax', business_os.report_metric(tax_amount, p_currency, tax_quality, tax_reason, tax_coverage, p_drill, p_from, p_to, p_basis, '["sale","fee"]'::jsonb, p_snapshot),
      'store_and_processor_fees', business_os.report_metric(fee_amount, p_currency, fee_quality, fee_reason, fee_coverage, p_drill, p_from, p_to, p_basis, '["sale","fee"]'::jsonb, p_snapshot),
      'net_sales', business_os.report_metric(net_sales, p_currency, case when net_sales is null then 'unavailable' else 'actual' end, sales_reason, case when net_sales is null then 'missing' else 'complete' end, p_drill, p_from, p_to, p_basis, '["sale","refund","chargeback"]'::jsonb, p_snapshot),
      'net_proceeds', business_os.report_metric(proceeds, p_currency, case when proceeds is null then 'unavailable' else 'actual' end, case when proceeds is null then case when fee_quality = 'estimated' or fee_quality = 'legacy_derived' then 'estimated_fees' else 'missing_fee_components' end else null end, case when proceeds is null then 'missing' else 'complete' end, p_drill, p_from, p_to, p_basis, '["sale","fee"]'::jsonb, p_snapshot),
      'direct_costs', business_os.report_metric(cost_amount, p_currency, cost_quality, cost_reason, cost_coverage, p_drill, p_from, p_to, p_basis, '["direct_cost"]'::jsonb, p_snapshot),
      'contribution_profit', business_os.report_metric(contribution, p_currency, case when contribution is null then 'unavailable' else 'actual' end, case when contribution is null then 'missing_direct_costs' else null end, case when contribution is null then 'missing' else 'complete' end, p_drill, p_from, p_to, p_basis, '["sale","direct_cost"]'::jsonb, p_snapshot),
      'operating_expenses', business_os.report_metric(opex_amount, p_currency, 'actual', null, 'complete', p_drill, p_from, p_to, p_basis, '["expense"]'::jsonb, p_snapshot),
      'operating_profit', business_os.report_metric(operating, p_currency, case when operating is null then 'unavailable' else 'actual' end, case when operating is null then 'incomplete_operating_profit' else null end, case when operating is null then 'missing' else 'complete' end, p_drill, p_from, p_to, p_basis, '["sale","expense"]'::jsonb, p_snapshot),
      'net_profit', business_os.report_metric(null, p_currency, 'unavailable', 'incomplete_other_income_financing_or_tax', 'missing', p_drill, p_from, p_to, p_basis, '["sale","expense"]'::jsonb, p_snapshot)
    ),
    'margin', business_os.money_text(margin)
  );
end;
$fn$;

create function business_os.component_rollup(
  p_org uuid,
  p_project uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text,
  p_currency text,
  p_types text[],
  p_gbp boolean
) returns table(total numeric, row_count integer, rollup_quality text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  summed numeric;
  counted integer;
  rolled text;
begin
  select
    count(*)::integer,
    sum(
      case
        when c.component_type in ('fee_reversal', 'tax_reversal') then -1
        else 1
      end * case
        when p_gbp then round(c.amount * o.central_gbp_amount / o.original_amount, 2)
        else c.amount
      end
    ),
    case
      when count(*) = 0 then null
      when bool_or(c.quality = 'unavailable' or c.amount is null) then 'unavailable'
      when bool_or(c.quality = 'estimated') then 'estimated'
      when bool_or(c.quality = 'legacy_derived') then 'legacy_derived'
      else 'actual'
    end
  into counted, summed, rolled
  from business_os.observation_components c
  join business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    on o.id = c.observation_id
  where c.posting_role = 'primary'
    and c.component_type = any (p_types)
    and (
      (p_gbp and o.central_gbp_amount is not null and o.original_amount > 0)
      or (not p_gbp and c.currency = p_currency)
    );

  if p_types && array['processor_fee', 'store_commission', 'network_fee', 'fee_reversal'] and not p_gbp then
    select
      counted + count(*)::integer,
      coalesce(summed, 0) + coalesce(sum(o.original_amount), 0),
      case
        when count(*) = 0 then rolled
        when rolled = 'unavailable' or bool_or(o.quality = 'unavailable' or o.original_amount is null) then 'unavailable'
        when rolled = 'estimated' or bool_or(o.quality = 'estimated') then 'estimated'
        when rolled = 'legacy_derived' or bool_or(o.quality = 'legacy_derived') then 'legacy_derived'
        when rolled is null then 'actual'
        else rolled
      end
    into counted, summed, rolled
    from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    where o.record_type = 'fee'
      and o.original_currency = p_currency
      and not exists (
        select 1
        from business_os.observation_components c
        where c.posting_role = 'primary'
          and o.component_id is not null
          and c.component_id = o.component_id
          and c.project_id = o.project_id
          and c.environment = o.environment
      );
  end if;

  total := summed;
  row_count := coalesce(counted, 0);
  rollup_quality := rolled;
  return next;
end;
$fn$;

create function business_os.native_subtotals(
  p_org uuid,
  p_project uuid,
  p_drill text,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text,
  p_snapshot text
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  cur text;
  result jsonb := '[]'::jsonb;
  gross numeric;
  gross_count integer;
  refund numeric;
  refund_count integer;
  tax record;
  fee record;
  cost numeric;
  cost_count integer;
  cost_quality text;
  opex numeric;
  derived jsonb;
  slices jsonb;
  unspecified boolean;
begin
  for cur in
    select currency
    from (
      select o.original_currency as currency
      from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
      where o.original_currency is not null
      union
      select c.currency
      from business_os.observation_components c
      join business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
        on o.id = c.observation_id
      where c.currency is not null
    ) currencies
    order by currency
  loop
    select coalesce(sum(o.original_amount), 0), count(*)::integer
      into gross, gross_count
    from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    where o.original_currency = cur
      and o.record_type = 'sale'
      and o.counts_as_new_revenue;

    select coalesce(sum(o.original_amount), 0), count(*)::integer
      into refund, refund_count
    from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    where o.original_currency = cur
      and o.record_type in ('refund', 'chargeback');

    select * into tax
    from business_os.component_rollup(
      p_org, p_project, p_from, p_to, p_basis, cur, array['sales_tax', 'tax_reversal'], false
    );
    select * into fee
    from business_os.component_rollup(
      p_org, p_project, p_from, p_to, p_basis, cur,
      array['processor_fee', 'store_commission', 'network_fee', 'fee_reversal'], false
    );

    select
      count(*)::integer,
      sum(o.original_amount),
      case
        when count(*) = 0 then null
        when bool_or(o.quality = 'unavailable' or o.original_amount is null) then 'unavailable'
        when bool_or(o.quality = 'estimated') then 'estimated'
        when bool_or(o.quality = 'legacy_derived') then 'legacy_derived'
        else 'actual'
      end
    into cost_count, cost, cost_quality
    from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    where o.original_currency = cur
      and o.record_type = 'direct_cost';

    select coalesce(sum(case when l.side = 'debit' then l.original_amount else -l.original_amount end), 0)
      into opex
    from business_os.financial_lines l
    join business_os.financial_entries e on e.id = l.entry_id
    join business_os.financial_accounts a on a.id = l.account_id
    where e.organization_id = p_org
      and e.status = 'posted'
      and e.kind <> 'reversal'
      and a.kind = 'opex'
      and l.original_currency = cur
      and e.effective_at >= p_from
      and e.effective_at < p_to
      and (p_project is null or l.project_id = p_project);

    derived := business_os.derive_metrics(
      cur, gross, gross_count, refund, refund_count,
      tax.total, tax.row_count, tax.rollup_quality,
      fee.total, fee.row_count, fee.rollup_quality,
      cost, cost_count, cost_quality, opex,
      p_basis, p_drill, p_from, p_to, p_snapshot
    );

    select coalesce(jsonb_agg(jsonb_build_object(
      'source_system', slice.source_system,
      'store', slice.store,
      'channel', slice.channel,
      'processor', slice.processor,
      'gross_customer_sales', slice.gross_customer_sales
    )), '[]'::jsonb)
      into slices
    from (
      select
        coalesce(o.source_system, 'unspecified') as source_system,
        coalesce(o.store, 'unspecified') as store,
        coalesce(o.channel, 'unspecified') as channel,
        coalesce(o.processor, 'unspecified') as processor,
        business_os.money_text(sum(o.original_amount)) as gross_customer_sales
      from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
      where o.original_currency = cur
        and o.record_type = 'sale'
        and o.counts_as_new_revenue
      group by 1, 2, 3, 4
    ) slice;

    unspecified := exists (
      select 1
      from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
      where o.original_currency = cur
        and (o.source_system is null or o.store is null or o.channel is null)
    );

    result := result || jsonb_build_array(jsonb_build_object(
      'currency', cur,
      'coverage', case when unspecified then 'partial' else 'complete' end,
      'slices', slices,
      'metrics', derived -> 'metrics',
      'margin', derived -> 'margin'
    ));
  end loop;
  return result;
end;
$fn$;

create function business_os.gbp_block(
  p_org uuid,
  p_project uuid,
  p_drill text,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text,
  p_snapshot text
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  missing integer;
  policies integer;
  reason text;
  policy text;
  gross numeric;
  gross_count integer;
  refund numeric;
  refund_count integer;
  tax record;
  fee record;
  cost numeric;
  cost_count integer;
  cost_quality text;
  opex numeric;
  derived jsonb;
  central_sum numeric;
  source_sum numeric;
  source_missing boolean;
  difference numeric;
begin
  select
    count(*) filter (where o.original_amount is not null and o.central_gbp_amount is null)::integer,
    count(distinct o.central_policy_version) filter (where o.central_gbp_amount is not null)::integer
  into missing, policies
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.record_type in ('sale', 'refund', 'chargeback', 'direct_cost', 'fee', 'expense');

  if coalesce(missing, 0) > 0 or coalesce(policies, 0) = 0 then
    reason := 'missing_fx';
  elsif policies > 1 then
    reason := 'fx_policy_mismatch';
  end if;

  select min(o.central_policy_version) into policy
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.central_gbp_amount is not null;

  if reason is not null then
    return jsonb_build_object(
      'policy_version', policy,
      'reason', reason,
      'conversion_difference', null,
      'metrics', null,
      'margin', null
    );
  end if;

  select coalesce(sum(o.central_gbp_amount), 0), count(*)::integer
    into gross, gross_count
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.record_type = 'sale' and o.counts_as_new_revenue;

  select coalesce(sum(o.central_gbp_amount), 0), count(*)::integer
    into refund, refund_count
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.record_type in ('refund', 'chargeback');

  select * into tax
  from business_os.component_rollup(
    p_org, p_project, p_from, p_to, p_basis, 'GBP', array['sales_tax', 'tax_reversal'], true
  );
  select * into fee
  from business_os.component_rollup(
    p_org, p_project, p_from, p_to, p_basis, 'GBP',
    array['processor_fee', 'store_commission', 'network_fee', 'fee_reversal'], true
  );

  select
    count(*)::integer,
    sum(o.central_gbp_amount),
    case
      when count(*) = 0 then null
      when bool_or(o.quality = 'estimated') then 'estimated'
      when bool_or(o.quality = 'legacy_derived') then 'legacy_derived'
      else 'actual'
    end
  into cost_count, cost, cost_quality
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.record_type = 'direct_cost';

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into opex
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = p_org
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and a.kind = 'opex'
    and e.effective_at >= p_from
    and e.effective_at < p_to
    and (p_project is null or l.project_id = p_project);

  derived := business_os.derive_metrics(
    'GBP', gross, gross_count, refund, refund_count,
    tax.total, tax.row_count, tax.rollup_quality,
    fee.total, fee.row_count, fee.rollup_quality,
    cost, cost_count, cost_quality, opex,
    p_basis, p_drill, p_from, p_to, p_snapshot
  );

  select
    sum(o.central_gbp_amount),
    sum(o.source_gbp_amount),
    bool_or(o.source_gbp_amount is null)
  into central_sum, source_sum, source_missing
  from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
  where o.original_amount is not null
    and o.record_type in ('sale', 'refund', 'chargeback', 'direct_cost', 'fee');

  if coalesce(source_missing, true) then
    difference := null;
  else
    difference := central_sum - source_sum;
  end if;

  return jsonb_build_object(
    'policy_version', policy,
    'reason', null,
    'conversion_difference', business_os.money_text(difference),
    'metrics', derived -> 'metrics',
    'margin', derived -> 'margin'
  );
end;
$fn$;

create function business_os.allocation_block(
  p_org uuid,
  p_project uuid,
  p_from timestamptz,
  p_to timestamptz
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  revenue numeric := 0;
  cogs numeric := 0;
  project_opex numeric := 0;
  allocation numeric := 0;
  allocation_all numeric := 0;
  company_cost numeric := 0;
  non_gbp boolean := false;
  pending boolean := false;
  profit_before numeric;
  profit_after numeric;
  unallocated numeric;
  reason text;
begin
  select exists (
    select 1
    from business_os.financial_entries e
    where e.organization_id = p_org
      and e.status = 'pending_valuation'
      and e.effective_at >= p_from
      and e.effective_at < p_to
      and (
        p_project is null
        or exists (
          select 1 from business_os.financial_lines l
          where l.entry_id = e.id and l.project_id = p_project
        )
      )
  ) into pending;

  select coalesce(sum(case when l.side = 'credit' then l.gbp_amount else -l.gbp_amount end), 0)
    into revenue
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = p_org
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and a.kind = 'revenue'
    and e.effective_at >= p_from
    and e.effective_at < p_to
    and (p_project is null or l.project_id = p_project);

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into cogs
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = p_org
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and a.kind = 'cogs'
    and e.effective_at >= p_from
    and e.effective_at < p_to
    and (p_project is null or l.project_id = p_project);

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into project_opex
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = p_org
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and a.kind = 'opex'
    and l.project_id is not null
    and e.effective_at >= p_from
    and e.effective_at < p_to
    and (p_project is null or l.project_id = p_project);

  select coalesce(sum(al.amount), 0), coalesce(bool_or(x.currency <> 'GBP'), false)
    into allocation, non_gbp
  from business_os.expense_allocations al
  join business_os.expenses x on x.id = al.expense_id
  join business_os.financial_entries e on e.id = x.posted_entry_id
  where x.organization_id = p_org
    and x.source_owner = 'simnetiq'
    and x.status = 'posted'
    and e.status = 'posted'
    and e.effective_at >= p_from
    and e.effective_at < p_to
    and (p_project is null or al.project_id = p_project);

  select coalesce(sum(al.amount), 0)
    into allocation_all
  from business_os.expense_allocations al
  join business_os.expenses x on x.id = al.expense_id
  join business_os.financial_entries e on e.id = x.posted_entry_id
  where x.organization_id = p_org
    and x.source_owner = 'simnetiq'
    and x.status = 'posted'
    and e.status = 'posted'
    and e.effective_at >= p_from
    and e.effective_at < p_to;

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into company_cost
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  join business_os.expenses x on x.posted_entry_id = e.id
  where x.organization_id = p_org
    and x.source_owner = 'simnetiq'
    and x.workflow_kind = 'expense'
    and a.kind = 'opex'
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and e.effective_at >= p_from
    and e.effective_at < p_to;

  if pending then
    profit_before := null;
    profit_after := null;
    unallocated := null;
    reason := 'missing_fx';
  else
    profit_before := revenue - cogs - project_opex;
    if non_gbp then
      profit_after := null;
      unallocated := null;
      reason := 'non_gbp_allocation';
    else
      profit_after := profit_before - allocation;
      unallocated := company_cost - allocation_all;
      reason := null;
    end if;
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'profit_before', business_os.money_text(profit_before),
    'allocation', business_os.money_text(allocation),
    'profit_after', business_os.money_text(profit_after),
    'company_cost', business_os.money_text(company_cost),
    'unallocated', business_os.money_text(unallocated),
    'reason', reason
  ));
end;
$fn$;

create function business_os.cash_block(
  p_org uuid,
  p_project uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  balances jsonb;
  movements jsonb;
  residuals jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'account_id', latest.account_id,
    'snapshot_kind', latest.snapshot_kind,
    'as_of', business_os.utc_instant(latest.as_of),
    'amount', business_os.money_text(latest.amount),
    'currency', latest.currency,
    'additive', false
  )), '[]'::jsonb)
    into balances
  from (
    select distinct on (b.account_id)
      b.account_id, b.snapshot_kind, b.as_of, b.amount, b.currency
    from business_os.balance_snapshots b
    where b.organization_id = p_org
      and b.as_of <= p_to
    order by b.account_id, b.as_of desc
  ) latest;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into movements
  from (
    select jsonb_build_object(
      'kind', e.kind,
      'amount', business_os.money_text(max(l.original_amount)),
      'currency', max(l.original_currency),
      'counts_as_new_revenue', false
    ) as item
    from business_os.financial_entries e
    join business_os.financial_lines l on l.entry_id = e.id and l.side = 'debit'
    where e.organization_id = p_org
      and e.kind in ('top_up', 'consumption', 'payout', 'transfer', 'opening_balance')
      and e.status in ('posted', 'pending_valuation')
      and e.counts_as_new_revenue = false
      and e.effective_at >= p_from
      and e.effective_at < p_to
      and (p_project is null or l.project_id = p_project)
    group by e.id, e.kind
    union all
    select jsonb_build_object(
      'kind', o.record_type,
      'amount', business_os.money_text(o.original_amount),
      'currency', o.original_currency,
      'counts_as_new_revenue', false
    )
    from business_os.report_observations(p_org, p_project, p_from, p_to, p_basis) o
    where o.record_type in ('settlement', 'transfer', 'opening_balance')
  ) movement;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', 'unmatched_settlement',
    'settlement_id', s.id,
    'amount', business_os.money_text(s.amount),
    'currency', s.currency,
    'quality', 'actual'
  )), '[]'::jsonb)
    into residuals
  from business_os.settlements s
  where s.organization_id = p_org
    and (p_project is null or s.project_id = p_project)
    and s.settled_at >= p_from
    and s.settled_at < p_to
    and not exists (
      select 1 from business_os.settlement_matches m where m.settlement_id = s.id
    );

  return jsonb_build_object(
    'balances', balances,
    'movements', movements,
    'residuals', residuals
  );
end;
$fn$;

create function business_os.legacy_bridge(
  p_org uuid,
  p_project uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_basis text
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  applicable boolean;
  body jsonb;
  fields jsonb;
  legacy_net numeric;
  has_start boolean;
  has_end boolean;
  has_topup boolean;
  spend_reason text;
begin
  select exists (
    select 1
    from business_os.source_observations o
    where o.organization_id = p_org
      and (p_project is null or o.project_id = p_project)
      and o.recognition_basis = 'sms_legacy'
      and o.status <> 'void'
      and o.occurred_at >= p_from
      and o.occurred_at < p_to
  ) or p_basis = 'sms_legacy'
  into applicable;
  if not applicable then
    return null;
  end if;

  select s.body into body
  from business_os.imported_snapshots s
  join business_os.source_connections c on c.id = s.connection_id
  where s.organization_id = p_org
    and s.dataset = 'finance/reconciliation'
    and s.status = 'current'
    and s.cutoff_from = p_from
    and s.cutoff_to = p_to
    and (p_project is null or c.project_id = p_project)
    and s.body #>> '{runs,0,legacy_comparison,formula_version}' = 'sms-legacy-usd-v1'
  order by s.created_at desc
  limit 1;

  fields := body #> '{runs,0,legacy_comparison,fields}';

  select sum(o.legacy_net_amount) into legacy_net
  from business_os.source_observations o
  where o.organization_id = p_org
    and (p_project is null or o.project_id = p_project)
    and o.recognition_basis = 'sms_legacy'
    and o.posting_role = 'primary'
    and o.status <> 'void'
    and o.occurred_at >= p_from
    and o.occurred_at < p_to;

  select exists (
    select 1 from business_os.balance_snapshots b
    where b.organization_id = p_org
      and b.snapshot_kind in ('prepaid', 'frozen')
      and b.as_of <= p_from
  ) into has_start;
  select exists (
    select 1 from business_os.balance_snapshots b
    where b.organization_id = p_org
      and b.snapshot_kind in ('prepaid', 'frozen')
      and b.as_of >= p_to
  ) into has_end;
  select exists (
    select 1 from business_os.financial_entries e
    where e.organization_id = p_org
      and e.kind = 'top_up'
      and e.effective_at >= p_from
      and e.effective_at < p_to
  ) into has_topup;
  if has_start and has_end and has_topup then
    spend_reason := 'source_formula_not_recomputed';
  else
    spend_reason := 'missing_balance_evidence';
  end if;

  return jsonb_build_object(
    'formula_version', 'sms-legacy-usd-v1',
    'currency', 'USD',
    'cash_net_is_bank_cash', false,
    'preserved', case
      when fields is null then null
      else jsonb_build_object(
        'gross', fields #>> '{gross,amount}',
        'apple_fee', fields #>> '{apple_fee,amount}',
        'refunds', fields #>> '{refunds,amount}',
        'cash_net', fields #>> '{cash_net,amount}'
      )
    end,
    'legacy_net_amount', business_os.money_text(legacy_net),
    'real_spend', null,
    'real_spend_reason', spend_reason,
    'warnings', jsonb_build_array(
      'cash_net_is_proceeds_not_bank',
      'earned_vs_purchase',
      'recorded_cost_vs_real_spend'
    )
  );
end;
$fn$;

create function business_os.london_bucket_start(instant timestamptz, grain text)
returns timestamptz
language sql
stable
set search_path = ''
as $fn$
  select timezone(
    'Europe/London',
    date_trunc(grain, timezone('Europe/London', instant))
  );
$fn$;

create function business_os.financial_report(actor_id uuid, payload jsonb)
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
  else
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

create function business_os.report_drill(actor_id uuid, payload jsonb)
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
  basis text;
  metric text;
  from_ts timestamptz;
  to_ts timestamptz;
  snapshot_id text;
  records jsonb;
begin
  org_id := business_os.assert_finance_reader(actor_id);
  basis := payload ->> 'basis';
  metric := payload ->> 'metric';
  if basis not in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  if metric not in (
    'gross_customer_sales', 'refunded_principal', 'sales_tax', 'store_and_processor_fees',
    'net_sales', 'net_proceeds', 'direct_costs', 'contribution_profit',
    'operating_expenses', 'operating_profit', 'net_profit'
  ) then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  from_ts := (payload ->> 'from')::timestamptz;
  to_ts := (payload ->> 'to')::timestamptz;
  if from_ts is null or to_ts is null or to_ts <= from_ts then
    raise exception 'period_invalid' using errcode = '22023';
  end if;
  if nullif(payload ->> 'project_slug', '') is not null then
    select p.id into project
    from business_os.projects p
    where p.organization_id = org_id
      and p.slug = payload ->> 'project_slug';
    if project is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;

  select s.snapshot_id into snapshot_id
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'observation_id', o.id,
    'revision', o.revision,
    'record_type', o.record_type,
    'formula_version', o.formula_version,
    'central_policy_version', o.central_policy_version,
    'central_fx_rate', business_os.money_text(o.central_fx_rate),
    'central_dataset_id', o.central_dataset_id,
    'source_policy_version', o.source_policy_version,
    'source_gbp_amount', business_os.money_text(o.source_gbp_amount),
    'original_amount', business_os.money_text(o.original_amount),
    'original_currency', o.original_currency,
    'components', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'component_id', c.component_id,
        'component_type', c.component_type,
        'amount', business_os.money_text(c.amount),
        'currency', c.currency,
        'quality', c.quality,
        'posting_role', c.posting_role
      )), '[]'::jsonb)
      from business_os.observation_components c
      where c.observation_id = o.id
    )
  )), '[]'::jsonb)
    into records
  from business_os.report_observations(org_id, project, from_ts, to_ts, basis) o
  where (
    (metric = 'gross_customer_sales' and o.record_type = 'sale' and o.counts_as_new_revenue)
    or (metric = 'refunded_principal' and o.record_type in ('refund', 'chargeback'))
    or (metric in ('sales_tax', 'store_and_processor_fees', 'net_sales', 'net_proceeds', 'contribution_profit', 'operating_profit', 'net_profit')
      and o.record_type in ('sale', 'refund', 'chargeback', 'fee'))
    or (metric = 'direct_costs' and o.record_type = 'direct_cost')
    or (metric = 'operating_expenses' and o.record_type = 'expense')
  );

  return jsonb_build_object(
    'snapshot_id', coalesce(snapshot_id, 'central-unverified'),
    'metric', metric,
    'records', records
  );
end;
$fn$;

create function business_os.add_residual(
  p_org uuid,
  p_run uuid,
  p_code text,
  p_amount numeric,
  p_currency text,
  p_quality text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into business_os.reconciliation_residuals (
    organization_id, run_id, code, amount, currency, quality, reason
  ) values (
    p_org, p_run, p_code, p_amount, p_currency, p_quality, p_reason
  );
end;
$fn$;

create function business_os.compare_shadow(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  project uuid;
  basis text;
  from_ts timestamptz;
  to_ts timestamptz;
  evidence text;
  report jsonb;
  snapshot jsonb;
  snap_id text;
  formula text;
  formula_count integer;
  next_status text := 'match';
  run_id uuid;
  native jsonb;
  snap_native jsonb;
  currency_row jsonb;
  report_currency jsonb;
  metric text;
  snap_amount text;
  report_amount text;
  keys text[] := array[
    'gross_customer_sales', 'refunded_principal', 'sales_tax', 'store_and_processor_fees',
    'net_sales', 'net_proceeds', 'direct_costs', 'contribution_profit',
    'operating_expenses', 'operating_profit', 'net_profit'
  ];
  sides text[] := array['export_api', 'central_journal'];
  gbp_reason text;
  snap_policy text;
  report_policy text;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  evidence := coalesce(payload ->> 'evidence_kind', 'synthetic');
  if evidence not in ('synthetic', 'redacted_real', 'live') then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  basis := payload ->> 'basis';
  from_ts := (payload ->> 'from')::timestamptz;
  to_ts := (payload ->> 'to')::timestamptz;
  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = payload ->> 'project_slug';
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;

  report := business_os.financial_report(
    actor_id,
    payload || jsonb_build_object('grain', 'custom')
  );
  native := coalesce(report #> '{buckets,0,native_currency_subtotals}', '[]'::jsonb);

  select s.body, s.snapshot_id into snapshot, snap_id
  from business_os.imported_snapshots s
  join business_os.source_connections c on c.id = s.connection_id
  where c.project_id = project
    and s.dataset = 'finance/summary'
    and s.status = 'current'
    and s.cutoff_from = from_ts
    and s.cutoff_to = to_ts
    and s.body ->> 'basis' = basis
  order by s.created_at desc
  limit 1;

  select count(distinct o.formula_version)::integer, min(o.formula_version)
    into formula_count, formula
  from business_os.report_observations(org_id, project, from_ts, to_ts, basis) o;

  insert into business_os.reconciliation_runs (
    organization_id, project_id, dataset, basis, formula_version, fx_policy_version,
    window_from, window_to, compared, status, evidence_kind, native_result, gbp_result, actor_user_id
  ) values (
    org_id, project, 'finance/summary', basis, formula, report #>> '{buckets,0,gbp,policy_version}',
    from_ts, to_ts, sides, 'incomplete', evidence, '{}'::jsonb, '{}'::jsonb, actor_id
  ) returning id into run_id;

  if snapshot is null then
    next_status := 'incomplete';
    perform business_os.add_residual(org_id, run_id, 'source_snapshot_missing', null, null, 'unavailable', 'source_snapshot_missing');
  else
    if formula_count > 1 then
      next_status := 'incomplete';
      perform business_os.add_residual(org_id, run_id, 'formula_versions_differ', null, null, 'unavailable', 'formula_versions_differ');
    elsif formula is not null and snapshot ->> 'formula_version' is distinct from formula then
      next_status := 'incomplete';
      perform business_os.add_residual(org_id, run_id, 'formula_mismatch', null, null, 'unavailable', 'formula_mismatch');
    end if;
    snap_native := coalesce(snapshot -> 'native_currency_subtotals', '[]'::jsonb);
    for currency_row in select value from jsonb_array_elements(snap_native) as item(value)
    loop
      select value into report_currency
      from jsonb_array_elements(native) as item(value)
      where value ->> 'currency' = currency_row ->> 'currency'
      limit 1;
      foreach metric in array keys loop
        snap_amount := currency_row #>> array['metrics', metric, 'amount'];
        report_amount := report_currency #>> array['metrics', metric, 'amount'];
        if report_currency is null
           or (snap_amount is null) is distinct from (report_amount is null)
           or (snap_amount is not null and report_amount is not null and snap_amount::numeric <> report_amount::numeric) then
          if next_status <> 'incomplete' then
            next_status := 'mismatch';
          end if;
          perform business_os.add_residual(
            org_id, run_id, 'native_mismatch',
            case
              when snap_amount is not null and report_amount is not null then abs(snap_amount::numeric - report_amount::numeric)
              else null
            end,
            currency_row ->> 'currency',
            case when snap_amount is null or report_amount is null then 'unavailable' else 'actual' end,
            metric
          );
        end if;
      end loop;
    end loop;
  end if;

  if payload -> 'source_admin' is null or payload -> 'source_admin' = 'null'::jsonb then
    perform business_os.add_residual(org_id, run_id, 'source_admin_not_provided', null, null, 'unavailable', 'source_admin_not_provided');
  else
    sides := sides || array['source_admin'];
  end if;

  snap_policy := snapshot ->> 'fx_policy_version';
  report_policy := report #>> '{buckets,0,gbp,policy_version}';
  gbp_reason := report #>> '{buckets,0,gbp,reason}';
  if snap_policy is not null and report_policy is not null and snap_policy is distinct from report_policy then
    perform business_os.add_residual(org_id, run_id, 'fx_policy_mismatch', null, 'GBP', 'unavailable', 'fx_policy_mismatch');
  elsif gbp_reason = 'missing_fx' then
    perform business_os.add_residual(org_id, run_id, 'missing_fx', null, 'GBP', 'unavailable', 'missing_fx');
  elsif gbp_reason = 'fx_policy_mismatch' then
    perform business_os.add_residual(org_id, run_id, 'fx_policy_mismatch', null, 'GBP', 'unavailable', 'fx_policy_mismatch');
  end if;

  update business_os.reconciliation_runs as saved
  set status = next_status,
      compared = sides,
      native_result = jsonb_build_object('report', native, 'snapshot', coalesce(snap_native, '[]'::jsonb)),
      gbp_result = coalesce(report #> '{buckets,0,gbp}', '{}'::jsonb)
  where saved.id = run_id;

  return jsonb_build_object(
    'run_id', run_id,
    'status', next_status,
    'evidence_kind', evidence,
    'snapshot_id', snap_id,
    'residuals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', r.code,
        'amount', business_os.money_text(r.amount),
        'currency', r.currency,
        'quality', r.quality,
        'reason', r.reason
      )), '[]'::jsonb)
      from business_os.reconciliation_residuals r
      where r.run_id = run_id
    )
  );
end;
$fn$;

create function business_os.activate_dataset_gate(actor_id uuid, run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  run business_os.reconciliation_runs%rowtype;
  open_gates integer;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  select * into run
  from business_os.reconciliation_runs r
  where r.id = run_id
    and r.organization_id = org_id;
  if run.id is null then
    raise exception 'observation_missing' using errcode = '22023';
  end if;
  if run.evidence_kind is distinct from 'live' then
    raise exception 'synthetic_evidence' using errcode = '42501';
  end if;
  if run.status <> 'match' then
    raise exception 'parity_incomplete' using errcode = '22023';
  end if;
  if exists (
    select 1
    from business_os.reconciliation_residuals residual
    where residual.run_id = run.id
      and residual.code in ('source_snapshot_missing', 'source_admin_not_provided', 'native_mismatch')
  ) then
    raise exception 'parity_incomplete' using errcode = '22023';
  end if;

  update business_os.dataset_verifications gate
  set state = 'verified',
      evidence_run_id = run.id,
      verified_at = clock_timestamp()
  where gate.project_id = run.project_id
    and gate.dataset = run.dataset
    and gate.basis = run.basis;
  if not found then
    raise exception 'gate_missing' using errcode = '22023';
  end if;

  select count(*)::integer into open_gates
  from business_os.dataset_verifications gate
  where gate.project_id = run.project_id
    and gate.state <> 'verified';
  if open_gates = 0 then
    update business_os.projects
    set state = 'verified',
        integration_verified_at = clock_timestamp()
    where id = run.project_id
      and state <> 'verified';
  end if;

  return jsonb_build_object(
    'project_id', run.project_id,
    'dataset', run.dataset,
    'basis', run.basis,
    'state', 'verified',
    'reporting_enabled', (
      select reporting_enabled from business_os.projects where id = run.project_id
    )
  );
end;
$fn$;

create function business_os.reconciliation_quality(actor_id uuid, project_slug text)
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
begin
  org_id := business_os.assert_finance_reader(actor_id);
  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = project_slug;
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'gates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dataset', gate.dataset,
        'basis', gate.basis,
        'state', gate.state,
        'verified_at', gate.verified_at
      ) order by gate.dataset, gate.basis), '[]'::jsonb)
      from business_os.dataset_verifications gate
      where gate.project_id = project
    ),
    'residuals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'run_id', r.id,
        'code', residual.code,
        'amount', business_os.money_text(residual.amount),
        'currency', residual.currency,
        'quality', residual.quality,
        'reason', residual.reason,
        'status', r.status
      )), '[]'::jsonb)
      from business_os.reconciliation_residuals residual
      join business_os.reconciliation_runs r on r.id = residual.run_id
      where r.project_id = project
        and r.status <> 'match'
    ),
    'quarantine_count', (
      select count(*)::integer
      from business_os.import_quarantine q
      join business_os.source_connections c on c.id = q.connection_id
      where c.project_id = project
    ),
    'snapshots', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dataset', s.dataset,
        'snapshot_id', s.snapshot_id,
        'data_as_of', s.data_as_of,
        'status', s.status
      )), '[]'::jsonb)
      from business_os.imported_snapshots s
      join business_os.source_connections c on c.id = s.connection_id
      where c.project_id = project
        and s.status = 'current'
    ),
    'runs', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'run_id', r.id,
        'dataset', r.dataset,
        'basis', r.basis,
        'status', r.status,
        'evidence_kind', r.evidence_kind,
        'window_from', r.window_from,
        'window_to', r.window_to
      ) order by r.created_at desc), '[]'::jsonb)
      from business_os.reconciliation_runs r
      where r.project_id = project
    )
  );
end;
$fn$;

create function business_os.record_settlement_match(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  match_id uuid;
  amount numeric;
  residual numeric;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  amount := business_os.parse_amount(payload ->> 'amount', payload ->> 'currency', null, null);
  if payload ->> 'residual' is null then
    residual := null;
  else
    residual := business_os.parse_amount(payload ->> 'residual', payload ->> 'currency', null, null);
  end if;
  insert into business_os.settlement_matches (
    organization_id, settlement_id, observation_id, amount, residual
  ) values (
    org_id,
    (payload ->> 'settlement_id')::uuid,
    (payload ->> 'observation_id')::uuid,
    amount,
    residual
  ) returning id into match_id;
  return match_id;
end;
$fn$;

create or replace function business_os.post_source_observation(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  project uuid;
  existing_id uuid;
  existing_hash text;
  obs_id uuid;
  entry_id uuid;
  amount numeric;
  source_gbp numeric;
  valuation jsonb;
  gbp_text text;
  pending boolean;
  make_journal boolean;
  obs_status text;
  entry_status text;
  coverage text;
  record_type text;
  posting_role text;
  basis text;
  counts_revenue boolean;
  observation_kind text;
  currency text;
  asset text;
  network text;
  reason text;
  quality text;
  component text;
  adjustment text;
  revision integer;
  linked_expense uuid;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'original_amount');
  perform business_os.reject_json_number(payload, 'source_gbp_amount');
  perform business_os.reject_json_number(payload, 'legacy_net_amount');

  if payload ->> 'project_slug' is null
     or payload ->> 'environment' not in ('local', 'staging', 'production')
     or payload ->> 'external_object_id' is null
     or payload ->> 'event_kind' is null
     or payload ->> 'economic_transaction_id' is null
     or payload ->> 'content_hash' !~ '^[a-f0-9]{64}$'
     or payload ->> 'formula_version' !~ '^[a-z0-9][a-z0-9._-]{0,63}$'
     or payload ->> 'occurred_at' is null then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  revision := (payload ->> 'revision')::integer;
  if revision is null or revision < 1 then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  adjustment := coalesce(payload ->> 'external_adjustment_id', '');
  record_type := payload ->> 'record_type';
  if record_type not in (
    'sale', 'refund', 'refund_reversal', 'chargeback', 'fee', 'expense',
    'direct_cost', 'settlement', 'transfer', 'opening_balance', 'summary'
  ) then
    raise exception 'inconsistent_record' using errcode = '22023';
  end if;
  basis := payload ->> 'recognition_basis';
  if basis not in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  posting_role := coalesce(payload ->> 'posting_role', 'primary');
  if posting_role not in ('primary', 'alias') then
    raise exception 'inconsistent_record' using errcode = '22023';
  end if;
  observation_kind := case when record_type = 'summary' then 'summary' else 'record' end;
  if observation_kind = 'summary' and coalesce((payload ->> 'posting')::boolean, false) then
    raise exception 'summary_non_posting' using errcode = '22023';
  end if;
  quality := payload ->> 'quality';
  if quality not in ('actual', 'estimated', 'legacy_derived', 'unavailable') then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  counts_revenue := coalesce((payload ->> 'counts_as_new_revenue')::boolean, false);
  if basis = 'sms_legacy' then
    counts_revenue := false;
    if payload ->> 'legacy_formula_version' is distinct from 'sms-legacy-usd-v1' then
      raise exception 'inconsistent_record' using errcode = '22023';
    end if;
  end if;
  if posting_role = 'alias' then
    counts_revenue := false;
  end if;
  if record_type = 'sale' and posting_role = 'primary' and basis <> 'sms_legacy' and not counts_revenue then
    raise exception 'inconsistent_record' using errcode = '22023';
  end if;
  if record_type <> 'sale' and counts_revenue then
    raise exception 'not_revenue' using errcode = '22023';
  end if;

  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = payload ->> 'project_slug';
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;

  select o.id, o.content_hash into existing_id, existing_hash
  from business_os.source_observations o
  where o.project_id = project
    and o.environment = payload ->> 'environment'
    and o.external_object_id = payload ->> 'external_object_id'
    and o.event_kind = payload ->> 'event_kind'
    and o.external_adjustment_id = adjustment
    and o.revision = revision;
  if found then
    if existing_hash = payload ->> 'content_hash' then
      return business_os.observation_result(existing_id);
    end if;
    raise exception 'duplicate_origin' using errcode = '23505';
  end if;

  currency := nullif(payload ->> 'original_currency', '');
  asset := nullif(payload ->> 'asset', '');
  network := nullif(payload ->> 'network', '');
  reason := nullif(payload ->> 'amount_reason', '');
  if payload ->> 'original_amount' is null then
    amount := null;
    if reason is null or quality <> 'unavailable' then
      raise exception 'amount_reason_required' using errcode = '22023';
    end if;
  else
    amount := business_os.parse_amount(payload ->> 'original_amount', currency, asset, network);
  end if;
  if payload ->> 'source_gbp_amount' is null then
    source_gbp := null;
  else
    source_gbp := business_os.parse_amount(payload ->> 'source_gbp_amount', 'GBP', null, null);
  end if;

  component := nullif(payload ->> 'component_id', '');
  if record_type = 'fee' and posting_role = 'primary' and component is not null and exists (
    select 1 from business_os.source_observations o
    where o.project_id = project
      and o.environment = payload ->> 'environment'
      and o.component_id = component
      and o.posting_role = 'primary'
      and o.record_type = 'fee'
      and o.status <> 'void'
  ) then
    raise exception 'duplicate_fee_component' using errcode = '23505';
  end if;
  if counts_revenue and posting_role = 'primary' and exists (
    select 1 from business_os.source_observations o
    where o.project_id = project
      and o.environment = payload ->> 'environment'
      and o.economic_transaction_id = payload ->> 'economic_transaction_id'
      and o.counts_as_new_revenue
      and o.posting_role = 'primary'
      and o.status <> 'void'
  ) then
    raise exception 'duplicate_economic' using errcode = '23505';
  end if;

  if business_os.period_is_locked(org_id, (payload ->> 'occurred_at')::timestamptz) then
    raise exception 'period_locked' using errcode = '42501';
  end if;

  make_journal := coalesce((payload ->> 'posting')::boolean, false)
    and observation_kind = 'record'
    and posting_role = 'primary'
    and basis <> 'sms_legacy'
    and amount is not null
    and amount > 0;
  if amount = 0 and coalesce((payload ->> 'posting')::boolean, false) then
    raise exception 'amount_zero' using errcode = '22023';
  end if;

  valuation := business_os.resolve_gbp(
    org_id, currency, asset, (payload ->> 'occurred_at')::timestamptz, amount
  );
  pending := coalesce((valuation ->> 'pending')::boolean, true);
  gbp_text := valuation ->> 'gbp_amount';

  if make_journal and (payload ->> 'debit_account' is null or payload ->> 'credit_account' is null) then
    raise exception 'account_missing' using errcode = '22023';
  end if;

  if make_journal and pending then
    obs_status := 'pending';
    entry_status := 'pending_valuation';
    coverage := 'partial';
  elsif make_journal then
    obs_status := 'posted';
    entry_status := 'posted';
    coverage := 'complete';
  elsif amount is null then
    obs_status := 'pending';
    entry_status := null;
    coverage := 'missing';
  else
    obs_status := 'observed';
    entry_status := null;
    coverage := 'partial';
  end if;

  begin
    insert into business_os.source_observations (
      organization_id, project_id, environment, external_object_id, event_kind,
      external_adjustment_id, revision, supersedes_revision, record_type, observation_kind,
      recognition_basis, posting_role, component_id, alias_ids, economic_transaction_id,
      counts_as_new_revenue, original_amount, original_currency, asset, network,
      amount_reason, quality, occurred_at, formula_version, legacy_formula_version,
      legacy_net_amount, content_hash, status, central_gbp_amount, central_fx_rate,
      central_policy_version, central_dataset_id, source_gbp_amount, source_policy_version,
      source_system, channel, store, processor
    ) values (
      org_id, project, payload ->> 'environment', payload ->> 'external_object_id', payload ->> 'event_kind',
      adjustment, revision, nullif(payload ->> 'supersedes_revision', '')::integer,
      record_type, observation_kind,
      basis, posting_role, component,
      coalesce(
        (
          select array_agg(value)
          from jsonb_array_elements_text(coalesce(payload -> 'alias_ids', '[]'::jsonb)) as item(value)
        ),
        '{}'
      ),
      payload ->> 'economic_transaction_id',
      counts_revenue, amount, currency, asset, network,
      reason, quality, (payload ->> 'occurred_at')::timestamptz, payload ->> 'formula_version',
      nullif(payload ->> 'legacy_formula_version', ''),
      case
        when payload ->> 'legacy_net_amount' is null then null
        else business_os.parse_amount(payload ->> 'legacy_net_amount', coalesce(currency, 'USD'), null, null)
      end,
      payload ->> 'content_hash', obs_status,
      case when gbp_text is null then null else gbp_text::numeric end,
      case when valuation ->> 'fx_rate' is null then null else (valuation ->> 'fx_rate')::numeric end,
      valuation ->> 'policy_version',
      nullif(valuation ->> 'dataset_id', '')::uuid,
      source_gbp,
      nullif(payload ->> 'source_policy_version', ''),
      business_os.optional_label(payload ->> 'source_system'),
      business_os.optional_label(payload ->> 'channel'),
      business_os.optional_label(payload ->> 'store'),
      business_os.optional_label(payload ->> 'processor')
    ) returning id into obs_id;
  exception
    when unique_violation then
      select o.id, o.content_hash into existing_id, existing_hash
      from business_os.source_observations o
      where o.project_id = project
        and o.environment = payload ->> 'environment'
        and o.external_object_id = payload ->> 'external_object_id'
        and o.event_kind = payload ->> 'event_kind'
        and o.external_adjustment_id = adjustment
        and o.revision = revision;
      if found and existing_hash = payload ->> 'content_hash' then
        return business_os.observation_result(existing_id);
      end if;
      if found then
        raise exception 'duplicate_origin' using errcode = '23505';
      end if;
      if record_type = 'fee' then
        raise exception 'duplicate_fee_component' using errcode = '23505';
      end if;
      raise exception 'duplicate_economic' using errcode = '23505';
  end;

  perform business_os.insert_observation_components(org_id, project, payload ->> 'environment', obs_id, payload);

  if make_journal then
    entry_id := business_os.create_journal_entry(
      org_id,
      actor_id,
      obs_id,
      null,
      'source',
      basis,
      counts_revenue,
      (payload ->> 'occurred_at')::timestamptz,
      entry_status,
      coverage,
      null,
      null,
      null,
      nullif(payload ->> 'replacement_of', '')::uuid,
      project,
      jsonb_build_array(
        jsonb_build_object(
          'account_code', payload ->> 'debit_account',
          'side', 'debit',
          'amount', payload ->> 'original_amount',
          'currency', currency,
          'asset', asset,
          'network', network,
          'gbp_amount', gbp_text,
          'fx_rate', valuation ->> 'fx_rate',
          'fx_dataset_id', valuation ->> 'dataset_id',
          'fx_policy_version', valuation ->> 'policy_version'
        ),
        jsonb_build_object(
          'account_code', payload ->> 'credit_account',
          'side', 'credit',
          'amount', payload ->> 'original_amount',
          'currency', currency,
          'asset', asset,
          'network', network,
          'gbp_amount', gbp_text,
          'fx_rate', valuation ->> 'fx_rate',
          'fx_dataset_id', valuation ->> 'dataset_id',
          'fx_policy_version', valuation ->> 'policy_version'
        )
      )
    );
    if record_type = 'expense' then
      insert into business_os.expenses (
        organization_id, workflow_kind, source_owner, project_id, status, vendor,
        category_id, amount, currency, tax_amount, posted_entry_id
      ) values (
        org_id, 'expense', 'project', project,
        case when entry_status = 'posted' then 'posted' else 'pending_valuation' end,
        coalesce(nullif(payload ->> 'vendor', ''), 'imported'),
        (select id from business_os.expense_categories c where c.organization_id = org_id and c.code = 'overhead'),
        amount, currency, null, entry_id
      ) returning id into linked_expense;
      update business_os.financial_entries as saved
      set expense_id = linked_expense
      where saved.id = entry_id;
    end if;
  end if;

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'post_source_observation', obs_id::text);

  return business_os.observation_result(obs_id);
end;
$fn$;



alter table business_os.observation_components enable row level security;
alter table business_os.observation_components force row level security;
alter table business_os.reconciliation_runs enable row level security;
alter table business_os.reconciliation_runs force row level security;
alter table business_os.reconciliation_residuals enable row level security;
alter table business_os.reconciliation_residuals force row level security;
alter table business_os.dataset_verifications enable row level security;
alter table business_os.dataset_verifications force row level security;
alter table business_os.settlement_matches enable row level security;
alter table business_os.settlement_matches force row level security;

create policy observation_components_select on business_os.observation_components
for select to authenticated using (business_os.is_active_member(organization_id));
create policy reconciliation_runs_select on business_os.reconciliation_runs
for select to authenticated using (business_os.is_active_member(organization_id));
create policy reconciliation_residuals_select on business_os.reconciliation_residuals
for select to authenticated using (business_os.is_active_member(organization_id));
create policy dataset_verifications_select on business_os.dataset_verifications
for select to authenticated using (business_os.is_active_member(organization_id));
create policy settlement_matches_select on business_os.settlement_matches
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on
  business_os.observation_components,
  business_os.reconciliation_runs,
  business_os.reconciliation_residuals,
  business_os.dataset_verifications,
  business_os.settlement_matches
from public, anon;
grant select on
  business_os.observation_components,
  business_os.reconciliation_runs,
  business_os.reconciliation_residuals,
  business_os.dataset_verifications,
  business_os.settlement_matches
to authenticated;
revoke insert, update, delete, truncate on
  business_os.observation_components,
  business_os.reconciliation_runs,
  business_os.reconciliation_residuals,
  business_os.dataset_verifications,
  business_os.settlement_matches
from authenticated;

revoke all on function business_os.optional_label(text) from public, anon, authenticated;
revoke all on function business_os.assert_finance_reader(uuid) from public, anon, authenticated;
revoke all on function business_os.insert_observation_components(uuid, uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.report_observations(uuid, uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function business_os.utc_instant(timestamptz) from public, anon, authenticated;
revoke all on function business_os.report_metric(numeric, text, text, text, text, text, timestamptz, timestamptz, text, jsonb, text) from public, anon, authenticated;
revoke all on function business_os.derive_metrics(text, numeric, integer, numeric, integer, numeric, integer, text, numeric, integer, text, numeric, integer, text, numeric, text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function business_os.component_rollup(uuid, uuid, timestamptz, timestamptz, text, text, text[], boolean) from public, anon, authenticated;
revoke all on function business_os.native_subtotals(uuid, uuid, text, timestamptz, timestamptz, text, text) from public, anon, authenticated;
revoke all on function business_os.gbp_block(uuid, uuid, text, timestamptz, timestamptz, text, text) from public, anon, authenticated;
revoke all on function business_os.allocation_block(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function business_os.cash_block(uuid, uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function business_os.legacy_bridge(uuid, uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function business_os.london_bucket_start(timestamptz, text) from public, anon, authenticated;
revoke all on function business_os.financial_report(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.report_drill(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.add_residual(uuid, uuid, text, numeric, text, text, text) from public, anon, authenticated;
revoke all on function business_os.compare_shadow(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.activate_dataset_gate(uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.reconciliation_quality(uuid, text) from public, anon, authenticated;
revoke all on function business_os.record_settlement_match(uuid, jsonb) from public, anon, authenticated;

grant execute on function business_os.financial_report(uuid, jsonb) to service_role;
grant execute on function business_os.report_drill(uuid, jsonb) to service_role;
grant execute on function business_os.compare_shadow(uuid, jsonb) to service_role;
grant execute on function business_os.activate_dataset_gate(uuid, uuid) to service_role;
grant execute on function business_os.reconciliation_quality(uuid, text) to service_role;
grant execute on function business_os.record_settlement_match(uuid, jsonb) to service_role;
