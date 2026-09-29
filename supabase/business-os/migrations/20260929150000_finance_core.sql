-- M2 finance core. Additive after 20260929120000_identity_foundation.sql.
-- Recovery: drop the tables and functions created below. Do not drop schema
-- business_os; that also removes the identity foundation. Do not apply this
-- file to the marketing database. The identity migration already refuses that.

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
  if to_regclass('business_os.organizations') is null then
    raise exception 'identity_foundation_missing';
  end if;
end
$guard$;

create table business_os.legal_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  legal_name text not null,
  jurisdiction text,
  registration_reference text,
  tax_reference text,
  vat_status text,
  fiscal_year_start date,
  created_at timestamptz not null default now()
);

create table business_os.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  code text not null,
  name text not null,
  kind text not null check (kind in (
    'bank', 'wallet', 'clearing', 'prepaid', 'frozen', 'reserved', 'pending_payout',
    'revenue', 'fees', 'cogs', 'opex', 'tax', 'owner_funding', 'manual_income',
    'fx_difference', 'payable', 'receivable'
  )),
  currency text,
  asset text,
  network text,
  created_at timestamptz not null default now(),
  unique (organization_id, code),
  check (
    (currency is not null and asset is null and network is null)
    or (currency is null and asset is not null and network is not null)
  ),
  check (currency is null or currency ~ '^[A-Z]{3}$')
);

create table business_os.expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  code text not null,
  name text not null,
  unique (organization_id, code)
);

create table business_os.exchange_rate_datasets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  policy_version text not null,
  source_name text not null,
  created_at timestamptz not null default now(),
  constraint exchange_rate_datasets_policy_key unique (organization_id, policy_version),
  check (policy_version ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  check (char_length(source_name) between 1 and 80)
);

create table business_os.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  dataset_id uuid not null references business_os.exchange_rate_datasets (id),
  base_code text not null,
  quote_currency text not null default 'GBP',
  rate numeric not null check (rate > 0),
  effective_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  constraint exchange_rates_slot_key unique (dataset_id, base_code, quote_currency, effective_at),
  check (quote_currency ~ '^[A-Z]{3}$'),
  check (base_code ~ '^[A-Z0-9]{2,12}$')
);

create table business_os.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  workflow_kind text not null check (workflow_kind in ('expense', 'manual_income')),
  source_owner text not null check (source_owner in ('simnetiq', 'project')),
  project_id uuid references business_os.projects (id),
  status text not null check (status in ('draft', 'posted', 'reversed', 'pending_valuation')),
  vendor text,
  category_id uuid references business_os.expense_categories (id),
  due_on date,
  paid_on date,
  service_on date,
  amount numeric not null check (amount > 0),
  currency text not null,
  tax_amount numeric,
  tax_inclusion text check (tax_inclusion is null or tax_inclusion in ('inclusive', 'exclusive', 'unknown')),
  vat_recoverable boolean,
  payment_account_id uuid references business_os.financial_accounts (id),
  posted_entry_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (currency ~ '^[A-Z]{3}$'),
  check (tax_amount is null or tax_amount >= 0),
  check (source_owner <> 'project' or project_id is not null),
  check (vendor is null or char_length(vendor) between 1 and 200)
);

create table business_os.financial_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  source_observation_id uuid,
  expense_id uuid references business_os.expenses (id),
  kind text not null check (kind in (
    'source', 'manual_expense', 'manual_income', 'reversal',
    'top_up', 'consumption', 'payout', 'transfer', 'opening_balance'
  )),
  status text not null check (status in ('draft', 'posted', 'reversed', 'pending_valuation')),
  recognition_basis text not null check (recognition_basis in (
    'purchase', 'earned_management', 'settled_cash', 'sms_legacy'
  )),
  counts_as_new_revenue boolean not null default false,
  coverage text not null check (coverage in ('complete', 'partial', 'missing')),
  effective_at timestamptz not null,
  external_id text,
  provenance text,
  reversal_of uuid references business_os.financial_entries (id),
  replacement_of uuid references business_os.financial_entries (id),
  created_by uuid,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create unique index financial_entries_external_idx
  on business_os.financial_entries (organization_id, kind, external_id)
  where external_id is not null;

alter table business_os.expenses
  add constraint expenses_posted_entry_fk
  foreign key (posted_entry_id) references business_os.financial_entries (id);

create table business_os.source_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  environment text not null check (environment in ('local', 'staging', 'production')),
  external_object_id text not null,
  event_kind text not null,
  external_adjustment_id text not null default '',
  revision integer not null check (revision >= 1),
  supersedes_revision integer,
  record_type text not null,
  observation_kind text not null check (observation_kind in ('record', 'summary')),
  recognition_basis text not null check (recognition_basis in (
    'purchase', 'earned_management', 'settled_cash', 'sms_legacy'
  )),
  posting_role text not null check (posting_role in ('primary', 'alias')),
  component_id text,
  alias_ids text[] not null default '{}',
  economic_transaction_id text not null,
  counts_as_new_revenue boolean not null,
  original_amount numeric,
  original_currency text,
  asset text,
  network text,
  amount_reason text,
  quality text not null check (quality in ('actual', 'estimated', 'legacy_derived', 'unavailable')),
  occurred_at timestamptz not null,
  formula_version text not null,
  legacy_formula_version text,
  legacy_net_amount numeric,
  content_hash text not null,
  status text not null check (status in ('posted', 'pending', 'void', 'observed')),
  central_gbp_amount numeric,
  central_fx_rate numeric,
  central_policy_version text,
  central_dataset_id uuid references business_os.exchange_rate_datasets (id),
  source_gbp_amount numeric,
  source_policy_version text,
  created_at timestamptz not null default now(),
  check (char_length(external_object_id) between 1 and 160),
  check (char_length(event_kind) between 1 and 80),
  check (char_length(economic_transaction_id) between 1 and 160),
  check (content_hash ~ '^[a-f0-9]{64}$'),
  check (formula_version ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  check (original_amount is null or original_amount >= 0),
  check (central_gbp_amount is null or central_gbp_amount >= 0),
  check (
    (original_currency is not null and asset is null and network is null)
    or (original_currency is null and asset is not null and network is not null)
    or (original_amount is null and original_currency is null and asset is null and network is null)
  )
);

alter table business_os.financial_entries
  add constraint financial_entries_observation_fk
  foreign key (source_observation_id) references business_os.source_observations (id);

create unique index source_observations_origin_idx
  on business_os.source_observations (
    project_id, environment, external_object_id, event_kind, external_adjustment_id, revision
  );

create unique index source_observations_primary_fee_idx
  on business_os.source_observations (project_id, environment, component_id)
  where component_id is not null
    and posting_role = 'primary'
    and record_type = 'fee'
    and status <> 'void';

create unique index source_observations_primary_revenue_idx
  on business_os.source_observations (project_id, environment, economic_transaction_id)
  where counts_as_new_revenue
    and posting_role = 'primary'
    and status <> 'void';

create table business_os.financial_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references business_os.financial_entries (id),
  organization_id uuid not null references business_os.organizations (id),
  account_id uuid not null references business_os.financial_accounts (id),
  project_id uuid references business_os.projects (id) on delete restrict,
  side text not null check (side in ('debit', 'credit')),
  original_amount numeric not null check (original_amount > 0),
  original_currency text,
  asset text,
  network text,
  gbp_amount numeric,
  fx_rate numeric,
  fx_dataset_id uuid references business_os.exchange_rate_datasets (id),
  fx_policy_version text,
  created_at timestamptz not null default now(),
  check (gbp_amount is null or gbp_amount > 0),
  check (fx_rate is null or fx_rate > 0),
  check (
    (original_currency is not null and asset is null and network is null)
    or (original_currency is null and asset is not null and network is not null)
  )
);

create index financial_lines_entry_idx on business_os.financial_lines (entry_id);
create index financial_lines_project_idx on business_os.financial_lines (project_id);
create index financial_entries_effective_idx
  on business_os.financial_entries (organization_id, effective_at);

create table business_os.expense_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  expense_id uuid not null references business_os.expenses (id),
  project_id uuid not null references business_os.projects (id),
  amount numeric not null check (amount > 0),
  unique (expense_id, project_id)
);

create table business_os.expense_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  expense_id uuid not null references business_os.expenses (id),
  object_path text not null,
  checksum_sha256 text not null,
  created_at timestamptz not null default now(),
  check (object_path ~ '^[a-z0-9][a-z0-9/_.-]{0,200}$'),
  check (object_path !~ '\.\.'),
  check (object_path !~ '://'),
  check (checksum_sha256 ~ '^[a-f0-9]{64}$')
);

create table business_os.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  account_id uuid not null references business_os.financial_accounts (id),
  amount numeric not null check (amount >= 0),
  currency text,
  asset text,
  network text,
  as_of timestamptz not null,
  available_amount numeric,
  pending_amount numeric,
  reserved_amount numeric,
  snapshot_kind text not null check (snapshot_kind in (
    'cash', 'prepaid', 'frozen', 'clearing', 'reserve', 'pending_payout'
  )),
  additive boolean not null default false check (additive = false),
  created_at timestamptz not null default now()
);

create table business_os.settlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid not null references business_os.projects (id),
  external_payout_id text not null,
  amount numeric not null check (amount >= 0),
  fee_amount numeric,
  currency text not null,
  settled_at timestamptz not null,
  entry_id uuid references business_os.financial_entries (id),
  created_at timestamptz not null default now(),
  unique (project_id, external_payout_id),
  check (fee_amount is null or fee_amount >= 0)
);

create table business_os.period_locks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  period_start date not null,
  period_end date not null,
  basis text not null check (basis in (
    'purchase', 'earned_management', 'settled_cash', 'sms_legacy'
  )),
  formula_version text not null,
  locked_at timestamptz not null default now(),
  locked_by uuid not null,
  reopened_at timestamptz,
  reopen_reason text,
  reopened_by uuid,
  check (period_end >= period_start),
  check (formula_version ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  check (reopened_at is null or reopen_reason is not null)
);

create table business_os.report_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  period_lock_id uuid references business_os.period_locks (id),
  basis text not null,
  period_start date not null,
  period_end date not null,
  formula_version text not null,
  coverage text not null check (coverage in ('complete', 'partial', 'missing')),
  created_at timestamptz not null default now()
);

create table business_os.finance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  actor_user_id uuid,
  action text not null,
  subject text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index period_locks_active_idx
  on business_os.period_locks (organization_id, period_start, period_end)
  where reopened_at is null;

insert into business_os.legal_entities (organization_id, legal_name)
select id, legal_name
from business_os.organizations
where slug = 'simnetiq';

insert into business_os.financial_accounts (
  organization_id, code, name, kind, currency, asset, network
)
select org.id, seed.code, seed.name, seed.kind, seed.currency, seed.asset, seed.network
from business_os.organizations org
cross join (
  values
    ('bank-gbp', 'Bank GBP', 'bank', 'GBP', null, null),
    ('wallet-gbp', 'Wallet GBP', 'wallet', 'GBP', null, null),
    ('wallet-ops-gbp', 'Ops wallet GBP', 'wallet', 'GBP', null, null),
    ('wallet-btc', 'Wallet BTC', 'wallet', null, 'BTC', 'bitcoin'),
    ('clearing-gbp', 'Clearing GBP', 'clearing', 'GBP', null, null),
    ('prepaid-gbp', 'Prepaid GBP', 'prepaid', 'GBP', null, null),
    ('frozen-gbp', 'Frozen GBP', 'frozen', 'GBP', null, null),
    ('reserved-gbp', 'Reserved GBP', 'reserved', 'GBP', null, null),
    ('pending-payout-gbp', 'Pending payout GBP', 'pending_payout', 'GBP', null, null),
    ('revenue-gbp', 'Revenue GBP', 'revenue', 'GBP', null, null),
    ('fees-gbp', 'Fees GBP', 'fees', 'GBP', null, null),
    ('cogs-gbp', 'COGS GBP', 'cogs', 'GBP', null, null),
    ('opex-gbp', 'Operating expenses GBP', 'opex', 'GBP', null, null),
    ('tax-gbp', 'Tax GBP', 'tax', 'GBP', null, null),
    ('owner-funding-gbp', 'Owner funding GBP', 'owner_funding', 'GBP', null, null),
    ('manual-income-gbp', 'Manual income GBP', 'manual_income', 'GBP', null, null),
    ('fx-difference-gbp', 'FX difference GBP', 'fx_difference', 'GBP', null, null),
    ('payable-gbp', 'Accounts payable GBP', 'payable', 'GBP', null, null),
    ('receivable-gbp', 'Accounts receivable GBP', 'receivable', 'GBP', null, null)
) as seed(code, name, kind, currency, asset, network)
where org.slug = 'simnetiq';

insert into business_os.expense_categories (organization_id, code, name)
select org.id, seed.code, seed.name
from business_os.organizations org
cross join (
  values
    ('hosting', 'Hosting'),
    ('supplier', 'Supplier'),
    ('overhead', 'Overhead'),
    ('other', 'Other')
) as seed(code, name)
where org.slug = 'simnetiq';

create function business_os.money_text(amount numeric)
returns text
language plpgsql
immutable
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  rendered text;
begin
  if amount is null then
    return null;
  end if;
  rendered := amount::text;
  if position('.' in rendered) > 0 then
    rendered := regexp_replace(rendered, '0+$', '');
    rendered := regexp_replace(rendered, '\.$', '');
  end if;
  return rendered;
end;
$fn$;

-- Fiat scales match contracts/business-os/v1/currency-exponents.json.
create function business_os.fiat_scale(currency text)
returns integer
language sql
immutable
set search_path = ''
as $fn$
  select case currency
    when 'GBP' then 2
    when 'USD' then 2
    when 'EUR' then 2
    when 'JPY' then 0
    when 'KRW' then 0
    when 'CAD' then 2
    when 'AUD' then 2
    when 'CHF' then 2
    when 'SEK' then 2
    when 'NOK' then 2
    when 'DKK' then 2
    when 'PLN' then 2
    when 'BRL' then 2
    when 'MXN' then 2
    when 'INR' then 2
    when 'CNY' then 2
    when 'HKD' then 2
    when 'SGD' then 2
    when 'NZD' then 2
    when 'TRY' then 2
    when 'ILS' then 2
    when 'KWD' then 3
    when 'BHD' then 3
    else null
  end;
$fn$;

create function business_os.parse_amount(
  raw text,
  currency text,
  asset text,
  network text
) returns numeric
language plpgsql
immutable
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  scale integer;
  fraction text;
  parsed numeric;
begin
  if raw is null or raw !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$' then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  if currency is not null and (asset is not null or network is not null) then
    raise exception 'currency_conflict' using errcode = '22023';
  end if;
  if currency is null and (asset is null or network is null) then
    raise exception 'currency_required' using errcode = '22023';
  end if;
  if asset is not null then
    if asset !~ '^[A-Z0-9]{2,12}$' or network !~ '^[a-z0-9-]{2,32}$' then
      raise exception 'currency_invalid' using errcode = '22023';
    end if;
    scale := 18;
  else
    if currency !~ '^[A-Z]{3}$' then
      raise exception 'currency_invalid' using errcode = '22023';
    end if;
    scale := business_os.fiat_scale(currency);
    if scale is null then
      raise exception 'currency_unsupported' using errcode = '22023';
    end if;
  end if;
  fraction := split_part(raw, '.', 2);
  if fraction is not null and char_length(fraction) > scale then
    raise exception 'amount_scale' using errcode = '22023';
  end if;
  parsed := raw::numeric;
  return parsed;
end;
$fn$;

create function business_os.parse_rate(raw text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  parsed numeric;
begin
  if raw is null or raw !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$' then
    raise exception 'rate_invalid' using errcode = '22023';
  end if;
  parsed := raw::numeric;
  if parsed <= 0 then
    raise exception 'rate_invalid' using errcode = '22023';
  end if;
  return parsed;
end;
$fn$;

create function business_os.assert_finance_writer(actor_id uuid)
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
    and m.role in ('owner', 'admin')
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'reader_forbidden' using errcode = '42501';
  end if;
  return org_id;
end;
$fn$;

create function business_os.reject_json_number(payload jsonb, key text)
returns void
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if payload ? key and jsonb_typeof(payload -> key) = 'number' then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
end;
$fn$;

create function business_os.period_is_locked(org_id uuid, effective_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from business_os.period_locks l
    join business_os.organizations o on o.id = l.organization_id
    where l.organization_id = org_id
      and l.reopened_at is null
      and (effective_at at time zone o.timezone)::date between l.period_start and l.period_end
  );
$fn$;

create function business_os.resolve_gbp(
  org_id uuid,
  currency text,
  asset text,
  occurred_at timestamptz,
  amount numeric
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  rate numeric;
  dataset uuid;
  policy text;
  gbp numeric;
begin
  if amount is null then
    return jsonb_build_object(
      'gbp_amount', null,
      'fx_rate', null,
      'dataset_id', null,
      'policy_version', 'gbp-unconfigured',
      'pending', true
    );
  end if;

  if currency = 'GBP' and asset is null then
    gbp := round(amount, 2);
    if gbp = 0 and amount > 0 then
      return jsonb_build_object(
        'gbp_amount', null,
        'fx_rate', null,
        'dataset_id', null,
        'policy_version', 'gbp-unconfigured',
        'pending', true
      );
    end if;
    return jsonb_build_object(
      'gbp_amount', business_os.money_text(gbp),
      'fx_rate', '1',
      'dataset_id', null,
      'policy_version', 'gbp-unconfigured',
      'pending', false
    );
  end if;

  select r.rate, r.dataset_id, d.policy_version
    into rate, dataset, policy
  from business_os.exchange_rates r
  join business_os.exchange_rate_datasets d on d.id = r.dataset_id
  where r.organization_id = org_id
    and r.base_code = coalesce(asset, currency)
    and r.quote_currency = 'GBP'
    and r.effective_at <= occurred_at
  order by r.effective_at desc
  limit 1;

  if rate is null then
    return jsonb_build_object(
      'gbp_amount', null,
      'fx_rate', null,
      'dataset_id', null,
      'policy_version', 'gbp-unconfigured',
      'pending', true
    );
  end if;

  gbp := round(amount * rate, 2);
  if gbp = 0 and amount > 0 then
    return jsonb_build_object(
      'gbp_amount', null,
      'fx_rate', business_os.money_text(rate),
      'dataset_id', dataset,
      'policy_version', policy,
      'pending', true
    );
  end if;

  return jsonb_build_object(
    'gbp_amount', business_os.money_text(gbp),
    'fx_rate', business_os.money_text(rate),
    'dataset_id', dataset,
    'policy_version', policy,
    'pending', false
  );
end;
$fn$;

create function business_os.create_journal_entry(
  org_id uuid,
  actor_id uuid,
  observation_id uuid,
  expense_id uuid,
  entry_kind text,
  entry_basis text,
  entry_revenue boolean,
  effective_at timestamptz,
  entry_status text,
  entry_coverage text,
  entry_external_id text,
  entry_provenance text,
  reversal_of uuid,
  replacement_of uuid,
  line_project_id uuid,
  lines jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  entry_id uuid;
  line jsonb;
  account uuid;
  line_amount numeric;
  line_gbp numeric;
  line_rate numeric;
  debit_sum numeric;
  credit_sum numeric;
  any_null boolean;
  any_zero boolean;
begin
  if entry_status in ('posted', 'pending_valuation')
     and business_os.period_is_locked(org_id, effective_at) then
    raise exception 'period_locked' using errcode = '42501';
  end if;

  if entry_kind in ('top_up', 'consumption', 'payout', 'transfer', 'opening_balance')
     and entry_revenue then
    raise exception 'not_revenue' using errcode = '22023';
  end if;

  insert into business_os.financial_entries (
    organization_id, source_observation_id, expense_id, kind, status,
    recognition_basis, counts_as_new_revenue, coverage, effective_at,
    external_id, provenance, reversal_of, replacement_of, created_by, posted_at
  ) values (
    org_id, observation_id, expense_id, entry_kind, entry_status,
    entry_basis, entry_revenue, entry_coverage, effective_at,
    entry_external_id, entry_provenance, reversal_of, replacement_of, actor_id,
    case when entry_status = 'posted' then clock_timestamp() else null end
  ) returning id into entry_id;

  for line in select value from jsonb_array_elements(lines) as item(value)
  loop
    if jsonb_typeof(line -> 'amount') = 'number' or jsonb_typeof(line -> 'gbp_amount') = 'number' then
      raise exception 'amount_invalid' using errcode = '22023';
    end if;
    select a.id into account
    from business_os.financial_accounts a
    where a.organization_id = org_id
      and a.code = line ->> 'account_code';
    if account is null then
      raise exception 'account_missing' using errcode = '22023';
    end if;
    if entry_kind in ('top_up', 'consumption', 'payout', 'transfer', 'opening_balance') then
      if exists (
        select 1 from business_os.financial_accounts a
        where a.id = account and a.kind in ('revenue', 'manual_income')
      ) then
        raise exception 'not_revenue' using errcode = '22023';
      end if;
    end if;
    line_amount := business_os.parse_amount(
      line ->> 'amount',
      nullif(line ->> 'currency', ''),
      nullif(line ->> 'asset', ''),
      nullif(line ->> 'network', '')
    );
    if line_amount = 0 then
      raise exception 'amount_zero' using errcode = '22023';
    end if;
    if line ->> 'gbp_amount' is null or line ->> 'gbp_amount' = '' then
      line_gbp := null;
    else
      line_gbp := business_os.parse_amount(line ->> 'gbp_amount', 'GBP', null, null);
      if line_gbp = 0 then
        raise exception 'amount_zero' using errcode = '22023';
      end if;
    end if;
    if line ->> 'fx_rate' is null or line ->> 'fx_rate' = '' then
      line_rate := null;
    else
      line_rate := business_os.parse_rate(line ->> 'fx_rate');
    end if;
    if line ->> 'side' not in ('debit', 'credit') then
      raise exception 'amount_invalid' using errcode = '22023';
    end if;
    insert into business_os.financial_lines (
      entry_id, organization_id, account_id, project_id, side,
      original_amount, original_currency, asset, network,
      gbp_amount, fx_rate, fx_dataset_id, fx_policy_version
    ) values (
      entry_id, org_id, account, line_project_id, line ->> 'side',
      line_amount, nullif(line ->> 'currency', ''), nullif(line ->> 'asset', ''), nullif(line ->> 'network', ''),
      line_gbp, line_rate, nullif(line ->> 'fx_dataset_id', '')::uuid, nullif(line ->> 'fx_policy_version', '')
    );
  end loop;

  select
    coalesce(sum(gbp_amount) filter (where side = 'debit'), 0),
    coalesce(sum(gbp_amount) filter (where side = 'credit'), 0),
    coalesce(bool_or(gbp_amount is null), false),
    coalesce(bool_or(gbp_amount = 0), false)
  into debit_sum, credit_sum, any_null, any_zero
  from business_os.financial_lines
  where financial_lines.entry_id = entry_id;

  if any_zero then
    raise exception 'amount_zero' using errcode = '22023';
  end if;
  if entry_status = 'posted' then
    if any_null or debit_sum <> credit_sum or debit_sum <= 0 then
      raise exception 'unbalanced' using errcode = '22023';
    end if;
  elsif entry_status = 'pending_valuation' then
    if exists (
      select 1 from business_os.financial_lines l
      where l.entry_id = entry_id
        and l.gbp_amount is not null
    ) then
      raise exception 'unbalanced' using errcode = '22023';
    end if;
  end if;

  return entry_id;
end;
$fn$;

create function business_os.observation_result(observation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  result jsonb;
begin
  select jsonb_build_object(
    'observation_id', o.id::text,
    'entry_id', e.id::text,
    'status', case
      when o.status = 'void' then 'void'
      when e.id is not null then e.status
      else o.status
    end,
    'central_gbp_amount', business_os.money_text(o.central_gbp_amount),
    'central_policy_version', o.central_policy_version,
    'source_gbp_amount', business_os.money_text(o.source_gbp_amount),
    'conversion_difference', case
      when o.central_gbp_amount is null or o.source_gbp_amount is null then null
      else business_os.money_text(o.central_gbp_amount - o.source_gbp_amount)
    end
  ) into result
  from business_os.source_observations o
  left join business_os.financial_entries e
    on e.source_observation_id = o.id
   and e.reversal_of is null
  where o.id = observation_result.observation_id;

  if result is null then
    raise exception 'observation_missing' using errcode = '22023';
  end if;
  return result;
end;
$fn$;

create function business_os.post_source_observation(actor_id uuid, payload jsonb)
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
      central_policy_version, central_dataset_id, source_gbp_amount, source_policy_version
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
      nullif(payload ->> 'source_policy_version', '')
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

create function business_os.parse_date(raw text)
returns date
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if raw is null then
    return null;
  end if;
  if raw !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'date_invalid' using errcode = '22023';
  end if;
  return raw::date;
exception
  when datetime_field_overflow or invalid_datetime_format or invalid_text_representation then
    raise exception 'date_invalid' using errcode = '22023';
end;
$fn$;

create function business_os.reverse_entry(actor_id uuid, target_entry uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  entry business_os.financial_entries%rowtype;
  reversal_id uuid;
  lines jsonb;
begin
  if reason is null or char_length(btrim(reason)) = 0 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  org_id := business_os.assert_finance_writer(actor_id);

  select * into entry
  from business_os.financial_entries e
  where e.id = target_entry
    and e.organization_id = org_id
  for update;

  if entry.id is null then
    raise exception 'entry_missing' using errcode = '22023';
  end if;
  if entry.status = 'draft' then
    raise exception 'not_draft' using errcode = '22023';
  end if;
  if entry.status = 'reversed' or exists (
    select 1 from business_os.financial_entries r where r.reversal_of = entry.id
  ) then
    raise exception 'already_reversed' using errcode = '23505';
  end if;
  if business_os.period_is_locked(org_id, entry.effective_at) then
    raise exception 'period_locked' using errcode = '42501';
  end if;

  if entry.status = 'pending_valuation' then
    update business_os.financial_entries
    set status = 'reversed'
    where id = entry.id;
    insert into business_os.finance_events (organization_id, actor_user_id, action, subject, reason)
    values (org_id, actor_id, 'reverse_pending', entry.id::text, btrim(reason));
    return entry.id;
  end if;

  select jsonb_agg(jsonb_build_object(
    'account_code', a.code,
    'side', case when l.side = 'debit' then 'credit' else 'debit' end,
    'amount', business_os.money_text(l.original_amount),
    'currency', l.original_currency,
    'asset', l.asset,
    'network', l.network,
    'gbp_amount', business_os.money_text(l.gbp_amount),
    'fx_rate', business_os.money_text(l.fx_rate),
    'fx_dataset_id', l.fx_dataset_id,
    'fx_policy_version', l.fx_policy_version
  )) into lines
  from business_os.financial_lines l
  join business_os.financial_accounts a on a.id = l.account_id
  where l.entry_id = entry.id;

  reversal_id := business_os.create_journal_entry(
    org_id, actor_id, entry.source_observation_id, entry.expense_id, 'reversal',
    entry.recognition_basis, false, entry.effective_at, 'posted', entry.coverage,
    null, btrim(reason), entry.id, null,
    (select l.project_id from business_os.financial_lines l where l.entry_id = entry.id limit 1),
    lines
  );

  update business_os.financial_entries
  set status = 'reversed'
  where id = entry.id;

  if entry.expense_id is not null then
    update business_os.expenses
    set status = 'reversed', updated_at = clock_timestamp()
    where id = entry.expense_id
      and source_owner = 'simnetiq';
  end if;

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject, reason)
  values (org_id, actor_id, 'reverse_entry', reversal_id::text, btrim(reason));
  return reversal_id;
end;
$fn$;

create function business_os.void_source_observation(actor_id uuid, observation_id uuid, reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  obs business_os.source_observations%rowtype;
  entry_id uuid;
  entry_status text;
begin
  if reason is null or char_length(btrim(reason)) = 0 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  org_id := business_os.assert_finance_writer(actor_id);
  select * into obs
  from business_os.source_observations o
  where o.id = observation_id
    and o.organization_id = org_id
  for update;
  if obs.id is null then
    raise exception 'observation_missing' using errcode = '22023';
  end if;
  if obs.status = 'void' then
    raise exception 'already_reversed' using errcode = '23505';
  end if;

  select e.id, e.status into entry_id, entry_status
  from business_os.financial_entries e
  where e.source_observation_id = obs.id
    and e.reversal_of is null
  order by e.created_at desc
  limit 1;

  if entry_id is not null and entry_status in ('posted', 'pending_valuation') then
    perform business_os.reverse_entry(actor_id, entry_id, reason);
  end if;

  update business_os.source_observations
  set status = 'void'
  where id = obs.id;

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject, reason)
  values (org_id, actor_id, 'void_source_observation', obs.id::text, btrim(reason));
  return business_os.observation_result(obs.id);
end;
$fn$;

create function business_os.replace_source_observation(
  actor_id uuid,
  observation_id uuid,
  payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  obs business_os.source_observations%rowtype;
  entry_id uuid;
  entry_status text;
  expected_revision integer;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  select * into obs
  from business_os.source_observations o
  where o.id = observation_id
    and o.organization_id = org_id
  for update;
  if obs.id is null then
    raise exception 'observation_missing' using errcode = '22023';
  end if;
  expected_revision := obs.revision + 1;
  if (payload ->> 'revision')::integer is distinct from expected_revision then
    raise exception 'replacement_invalid' using errcode = '22023';
  end if;
  if payload ->> 'external_object_id' is distinct from obs.external_object_id
     or payload ->> 'event_kind' is distinct from obs.event_kind
     or coalesce(payload ->> 'external_adjustment_id', '') is distinct from obs.external_adjustment_id then
    raise exception 'replacement_invalid' using errcode = '22023';
  end if;

  select e.id, e.status into entry_id, entry_status
  from business_os.financial_entries e
  where e.source_observation_id = obs.id
    and e.reversal_of is null
    and e.status in ('posted', 'pending_valuation')
  limit 1;
  if entry_id is not null then
    perform business_os.reverse_entry(actor_id, entry_id, 'replacement');
  end if;

  update business_os.source_observations
  set status = 'void'
  where id = obs.id;

  return business_os.post_source_observation(
    actor_id,
    payload || jsonb_build_object('supersedes_revision', obs.revision, 'replacement_of', entry_id)
  );
end;
$fn$;

create function business_os.draft_manual_entry(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  expense_id uuid;
  category uuid;
  account uuid;
  amount numeric;
  tax numeric;
  workflow text;
  inclusion text;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'amount');
  perform business_os.reject_json_number(payload, 'tax_amount');
  workflow := payload ->> 'workflow_kind';
  if workflow not in ('expense', 'manual_income') then
    raise exception 'workflow_invalid' using errcode = '22023';
  end if;
  amount := business_os.parse_amount(payload ->> 'amount', payload ->> 'currency', null, null);
  if amount = 0 then
    raise exception 'amount_zero' using errcode = '22023';
  end if;
  if payload ->> 'tax_amount' is null then
    tax := null;
  else
    tax := business_os.parse_amount(payload ->> 'tax_amount', payload ->> 'currency', null, null);
  end if;
  inclusion := nullif(payload ->> 'tax_inclusion', '');
  if inclusion is not null and inclusion not in ('inclusive', 'exclusive', 'unknown') then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  if workflow = 'expense' then
    select c.id into category
    from business_os.expense_categories c
    where c.organization_id = org_id
      and c.code = payload ->> 'category';
    if category is null then
      raise exception 'category_invalid' using errcode = '22023';
    end if;
  end if;
  if nullif(payload ->> 'payment_account_code', '') is not null then
    select a.id into account
    from business_os.financial_accounts a
    where a.organization_id = org_id
      and a.code = payload ->> 'payment_account_code';
    if account is null then
      raise exception 'account_missing' using errcode = '22023';
    end if;
  end if;
  if (payload ? 'receipt_path') <> (payload ? 'receipt_checksum') then
    raise exception 'receipt_invalid' using errcode = '22023';
  end if;

  insert into business_os.expenses (
    organization_id, workflow_kind, source_owner, status, vendor, category_id,
    due_on, paid_on, service_on, amount, currency, tax_amount, tax_inclusion,
    vat_recoverable, payment_account_id
  ) values (
    org_id, workflow, 'simnetiq', 'draft', nullif(payload ->> 'vendor', ''), category,
    business_os.parse_date(nullif(payload ->> 'due_on', '')),
    business_os.parse_date(nullif(payload ->> 'paid_on', '')),
    business_os.parse_date(nullif(payload ->> 'service_on', '')),
    amount, payload ->> 'currency', tax, inclusion,
    case
      when payload ->> 'vat_recoverable' is null then null
      else (payload ->> 'vat_recoverable')::boolean
    end,
    account
  ) returning id into expense_id;

  if payload ->> 'receipt_path' is not null then
    insert into business_os.expense_receipts (organization_id, expense_id, object_path, checksum_sha256)
    values (org_id, expense_id, payload ->> 'receipt_path', payload ->> 'receipt_checksum');
  end if;

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'draft_manual_entry', expense_id::text);
  return jsonb_build_object('expense_id', expense_id::text, 'status', 'draft');
end;
$fn$;

create function business_os.update_manual_draft(actor_id uuid, target_expense uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  expense business_os.expenses%rowtype;
  amount numeric;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'amount');
  select * into expense
  from business_os.expenses e
  where e.id = target_expense
    and e.organization_id = org_id
  for update;
  if expense.id is null then
    raise exception 'entry_missing' using errcode = '22023';
  end if;
  if expense.source_owner <> 'simnetiq' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  if expense.status <> 'draft' then
    raise exception 'not_draft' using errcode = '22023';
  end if;
  amount := business_os.parse_amount(
    coalesce(payload ->> 'amount', business_os.money_text(expense.amount)),
    coalesce(payload ->> 'currency', expense.currency),
    null, null
  );
  update business_os.expenses
  set vendor = coalesce(nullif(payload ->> 'vendor', ''), vendor),
      amount = amount,
      currency = coalesce(payload ->> 'currency', currency),
      due_on = coalesce(business_os.parse_date(nullif(payload ->> 'due_on', '')), due_on),
      paid_on = coalesce(business_os.parse_date(nullif(payload ->> 'paid_on', '')), paid_on),
      service_on = coalesce(business_os.parse_date(nullif(payload ->> 'service_on', '')), service_on),
      updated_at = clock_timestamp()
  where id = expense.id;
  return jsonb_build_object('expense_id', expense.id::text, 'status', 'draft');
end;
$fn$;

create function business_os.post_manual_entry(actor_id uuid, target_expense uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  expense business_os.expenses%rowtype;
  tz text;
  effective_at timestamptz;
  payment_code text;
  credit_code text;
  debit_code text;
  valuation jsonb;
  tax_valuation jsonb;
  pending boolean;
  gbp_text text;
  tax_gbp text;
  entry_status text;
  coverage text;
  entry_id uuid;
  lines jsonb;
  tax_currency text;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  select * into expense
  from business_os.expenses e
  where e.id = target_expense
    and e.organization_id = org_id
  for update;
  if expense.id is null then
    raise exception 'entry_missing' using errcode = '22023';
  end if;
  if expense.source_owner <> 'simnetiq' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  if expense.status <> 'draft' then
    raise exception 'not_draft' using errcode = '22023';
  end if;

  select o.timezone into tz
  from business_os.organizations o
  where o.id = org_id;
  effective_at := (
    coalesce(expense.paid_on, expense.service_on, expense.due_on, (clock_timestamp() at time zone tz)::date)::timestamp
    at time zone tz
  );

  if expense.paid_on is not null and expense.payment_account_id is null then
    raise exception 'account_missing' using errcode = '22023';
  end if;
  if expense.payment_account_id is not null then
    select a.code into payment_code
    from business_os.financial_accounts a
    where a.id = expense.payment_account_id;
  end if;

  if expense.workflow_kind = 'expense' then
    debit_code := 'opex-gbp';
    credit_code := coalesce(payment_code, 'payable-gbp');
  else
    debit_code := coalesce(payment_code, 'receivable-gbp');
    credit_code := 'manual-income-gbp';
  end if;

  valuation := business_os.resolve_gbp(org_id, expense.currency, null, effective_at, expense.amount);
  pending := coalesce((valuation ->> 'pending')::boolean, true);
  gbp_text := valuation ->> 'gbp_amount';
  tax_currency := expense.currency;
  if expense.tax_amount is not null and expense.tax_inclusion = 'exclusive' then
    tax_valuation := business_os.resolve_gbp(org_id, expense.currency, null, effective_at, expense.tax_amount);
    pending := pending or coalesce((tax_valuation ->> 'pending')::boolean, true);
    tax_gbp := tax_valuation ->> 'gbp_amount';
  end if;

  coverage := case when expense.tax_amount is null or pending then 'partial' else 'complete' end;
  entry_status := case when pending then 'pending_valuation' else 'posted' end;

  if expense.tax_amount is not null and expense.tax_inclusion = 'exclusive' then
    lines := jsonb_build_array(
      jsonb_build_object(
        'account_code', debit_code, 'side', 'debit', 'amount', business_os.money_text(expense.amount),
        'currency', expense.currency, 'gbp_amount', gbp_text, 'fx_rate', valuation ->> 'fx_rate',
        'fx_dataset_id', valuation ->> 'dataset_id', 'fx_policy_version', valuation ->> 'policy_version'
      ),
      jsonb_build_object(
        'account_code', 'tax-gbp', 'side', 'debit', 'amount', business_os.money_text(expense.tax_amount),
        'currency', tax_currency, 'gbp_amount', tax_gbp, 'fx_rate', tax_valuation ->> 'fx_rate',
        'fx_dataset_id', tax_valuation ->> 'dataset_id', 'fx_policy_version', tax_valuation ->> 'policy_version'
      ),
      jsonb_build_object(
        'account_code', credit_code, 'side', 'credit',
        'amount', business_os.money_text(expense.amount + expense.tax_amount),
        'currency', expense.currency,
        'gbp_amount', case
          when gbp_text is null or tax_gbp is null then null
          else business_os.money_text(gbp_text::numeric + tax_gbp::numeric)
        end,
        'fx_rate', valuation ->> 'fx_rate',
        'fx_dataset_id', valuation ->> 'dataset_id',
        'fx_policy_version', valuation ->> 'policy_version'
      )
    );
  else
    lines := jsonb_build_array(
      jsonb_build_object(
        'account_code', debit_code, 'side', 'debit', 'amount', business_os.money_text(expense.amount),
        'currency', expense.currency, 'gbp_amount', gbp_text, 'fx_rate', valuation ->> 'fx_rate',
        'fx_dataset_id', valuation ->> 'dataset_id', 'fx_policy_version', valuation ->> 'policy_version'
      ),
      jsonb_build_object(
        'account_code', credit_code, 'side', 'credit', 'amount', business_os.money_text(expense.amount),
        'currency', expense.currency, 'gbp_amount', gbp_text, 'fx_rate', valuation ->> 'fx_rate',
        'fx_dataset_id', valuation ->> 'dataset_id', 'fx_policy_version', valuation ->> 'policy_version'
      )
    );
  end if;

  if pending then
    select jsonb_agg(
      case when item ? 'gbp_amount' then item || jsonb_build_object('gbp_amount', null) else item end
    ) into lines
    from jsonb_array_elements(lines) as row(item);
  end if;

  entry_id := business_os.create_journal_entry(
    org_id, actor_id, null, expense.id,
    case when expense.workflow_kind = 'expense' then 'manual_expense' else 'manual_income' end,
    'purchase', false, effective_at, entry_status, coverage,
    null, null, null, null, null, lines
  );

  update business_os.expenses
  set status = case when entry_status = 'posted' then 'posted' else 'pending_valuation' end,
      posted_entry_id = entry_id,
      updated_at = clock_timestamp()
  where id = expense.id;

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'post_manual_entry', entry_id::text);
  return jsonb_build_object(
    'expense_id', expense.id::text,
    'entry_id', entry_id::text,
    'status', entry_status
  );
end;
$fn$;

create function business_os.allocate_shared_expense(
  actor_id uuid,
  target_expense uuid,
  allocations jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  expense business_os.expenses%rowtype;
  item jsonb;
  project uuid;
  amount numeric;
  total numeric := 0;
  kept uuid[] := '{}';
  allocation_id uuid;
  rows jsonb := '[]'::jsonb;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  if jsonb_typeof(allocations) <> 'array' then
    raise exception 'allocation_invalid' using errcode = '22023';
  end if;
  select * into expense
  from business_os.expenses e
  where e.id = target_expense
    and e.organization_id = org_id
  for update;
  if expense.id is null then
    raise exception 'entry_missing' using errcode = '22023';
  end if;
  if expense.source_owner <> 'simnetiq' or expense.workflow_kind <> 'expense' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  if expense.status <> 'posted' then
    raise exception 'expense_not_posted' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(allocations) as row(value)
  loop
    perform business_os.reject_json_number(item, 'amount');
    select p.id into project
    from business_os.projects p
    where p.organization_id = org_id
      and p.slug = item ->> 'project_slug';
    if project is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
    amount := business_os.parse_amount(item ->> 'amount', expense.currency, null, null);
    if amount = 0 then
      raise exception 'allocation_invalid' using errcode = '22023';
    end if;
    total := total + amount;
    insert into business_os.expense_allocations (
      id, organization_id, expense_id, project_id, amount
    ) values (
      coalesce(nullif(item ->> 'allocation_id', '')::uuid, gen_random_uuid()),
      org_id, expense.id, project, amount
    )
    on conflict (expense_id, project_id) do update
      set amount = excluded.amount
    returning id into allocation_id;
    kept := kept || allocation_id;
    rows := rows || jsonb_build_array(jsonb_build_object(
      'allocation_id', allocation_id::text,
      'project_slug', item ->> 'project_slug',
      'amount', business_os.money_text(amount)
    ));
  end loop;

  if total > expense.amount then
    raise exception 'allocation_exceeds' using errcode = '22023';
  end if;

  delete from business_os.expense_allocations al
  where al.expense_id = expense.id
    and not (al.id = any (kept));

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'allocate_shared_expense', expense.id::text);

  return jsonb_build_object(
    'expense_id', expense.id::text,
    'allocations', rows,
    'unallocated', business_os.money_text(expense.amount - total),
    'company_expense_id', expense.id::text
  );
end;
$fn$;

create function business_os.post_movement(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  existing uuid;
  project uuid;
  amount numeric;
  valuation jsonb;
  pending boolean;
  entry_id uuid;
  kind text;
  basis text;
  currency text;
  asset text;
  network text;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'amount');
  kind := payload ->> 'kind';
  if kind not in ('top_up', 'consumption', 'payout', 'transfer', 'opening_balance') then
    raise exception 'workflow_invalid' using errcode = '22023';
  end if;
  basis := payload ->> 'recognition_basis';
  if basis not in ('purchase', 'earned_management', 'settled_cash') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  if kind = 'opening_balance' and nullif(payload ->> 'provenance', '') is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  if payload ->> 'external_id' is null then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  select e.id into existing
  from business_os.financial_entries e
  where e.organization_id = org_id
    and e.kind = kind
    and e.external_id = payload ->> 'external_id';
  if existing is not null then
    return jsonb_build_object('entry_id', existing::text, 'status', (
      select status from business_os.financial_entries where id = existing
    ));
  end if;

  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = payload ->> 'project_slug';
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;

  currency := nullif(payload ->> 'currency', '');
  asset := nullif(payload ->> 'asset', '');
  network := nullif(payload ->> 'network', '');
  amount := business_os.parse_amount(payload ->> 'amount', currency, asset, network);
  if amount = 0 then
    raise exception 'amount_zero' using errcode = '22023';
  end if;
  valuation := business_os.resolve_gbp(
    org_id, currency, asset, (payload ->> 'effective_at')::timestamptz, amount
  );
  pending := coalesce((valuation ->> 'pending')::boolean, true);

  entry_id := business_os.create_journal_entry(
    org_id, actor_id, null, null, kind, basis, false,
    (payload ->> 'effective_at')::timestamptz,
    case when pending then 'pending_valuation' else 'posted' end,
    case when pending then 'partial' else 'complete' end,
    payload ->> 'external_id',
    nullif(payload ->> 'provenance', ''),
    null, null, project,
    jsonb_build_array(
      jsonb_build_object(
        'account_code', payload ->> 'debit_account', 'side', 'debit',
        'amount', payload ->> 'amount', 'currency', currency, 'asset', asset, 'network', network,
        'gbp_amount', case when pending then null else valuation ->> 'gbp_amount' end,
        'fx_rate', case when pending then null else valuation ->> 'fx_rate' end,
        'fx_dataset_id', case when pending then null else valuation ->> 'dataset_id' end,
        'fx_policy_version', valuation ->> 'policy_version'
      ),
      jsonb_build_object(
        'account_code', payload ->> 'credit_account', 'side', 'credit',
        'amount', payload ->> 'amount', 'currency', currency, 'asset', asset, 'network', network,
        'gbp_amount', case when pending then null else valuation ->> 'gbp_amount' end,
        'fx_rate', case when pending then null else valuation ->> 'fx_rate' end,
        'fx_dataset_id', case when pending then null else valuation ->> 'dataset_id' end,
        'fx_policy_version', valuation ->> 'policy_version'
      )
    )
  );

  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'post_movement', entry_id::text);
  return jsonb_build_object(
    'entry_id', entry_id::text,
    'status', case when pending then 'pending_valuation' else 'posted' end
  );
end;
$fn$;

create function business_os.record_balance_snapshot(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  account uuid;
  snapshot_id uuid;
  amount numeric;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'amount');
  if payload ->> 'snapshot_kind' not in ('cash', 'prepaid', 'frozen', 'clearing', 'reserve', 'pending_payout') then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;
  select a.id into account
  from business_os.financial_accounts a
  where a.organization_id = org_id
    and a.code = payload ->> 'account_code';
  if account is null then
    raise exception 'account_missing' using errcode = '22023';
  end if;
  amount := business_os.parse_amount(
    payload ->> 'amount',
    nullif(payload ->> 'currency', ''),
    nullif(payload ->> 'asset', ''),
    nullif(payload ->> 'network', '')
  );
  insert into business_os.balance_snapshots (
    organization_id, account_id, amount, currency, asset, network, as_of,
    available_amount, pending_amount, reserved_amount, snapshot_kind, additive
  ) values (
    org_id, account, amount,
    nullif(payload ->> 'currency', ''), nullif(payload ->> 'asset', ''), nullif(payload ->> 'network', ''),
    (payload ->> 'as_of')::timestamptz,
    case when payload ->> 'available_amount' is null then null
      else business_os.parse_amount(payload ->> 'available_amount', nullif(payload ->> 'currency', ''), nullif(payload ->> 'asset', ''), nullif(payload ->> 'network', '')) end,
    case when payload ->> 'pending_amount' is null then null
      else business_os.parse_amount(payload ->> 'pending_amount', nullif(payload ->> 'currency', ''), nullif(payload ->> 'asset', ''), nullif(payload ->> 'network', '')) end,
    case when payload ->> 'reserved_amount' is null then null
      else business_os.parse_amount(payload ->> 'reserved_amount', nullif(payload ->> 'currency', ''), nullif(payload ->> 'asset', ''), nullif(payload ->> 'network', '')) end,
    payload ->> 'snapshot_kind', false
  ) returning id into snapshot_id;
  return snapshot_id;
end;
$fn$;

create function business_os.record_settlement(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  project uuid;
  settlement_id uuid;
  amount numeric;
  fee numeric;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  perform business_os.reject_json_number(payload, 'amount');
  perform business_os.reject_json_number(payload, 'fee_amount');
  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = payload ->> 'project_slug';
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;
  amount := business_os.parse_amount(payload ->> 'amount', payload ->> 'currency', null, null);
  if payload ->> 'fee_amount' is null then
    fee := null;
  else
    fee := business_os.parse_amount(payload ->> 'fee_amount', payload ->> 'currency', null, null);
  end if;
  insert into business_os.settlements (
    organization_id, project_id, external_payout_id, amount, fee_amount, currency, settled_at, entry_id
  ) values (
    org_id, project, payload ->> 'external_payout_id', amount, fee, payload ->> 'currency',
    (payload ->> 'settled_at')::timestamptz, nullif(payload ->> 'entry_id', '')::uuid
  ) returning id into settlement_id;
  return settlement_id;
end;
$fn$;

create function business_os.register_fx_dataset(
  actor_id uuid,
  policy_version text,
  source_name text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  dataset_id uuid;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  if policy_version !~ '^[a-z0-9][a-z0-9._-]{0,63}$' or char_length(source_name) < 1 then
    raise exception 'formula_invalid' using errcode = '22023';
  end if;
  insert into business_os.exchange_rate_datasets (organization_id, policy_version, source_name)
  values (org_id, policy_version, source_name)
  on conflict on constraint exchange_rate_datasets_policy_key do update
    set source_name = excluded.source_name
  returning id into dataset_id;
  return dataset_id;
end;
$fn$;

create function business_os.insert_exchange_rate(
  actor_id uuid,
  dataset_id uuid,
  base_code text,
  quote_currency text,
  rate_text text,
  effective_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  rate_id uuid;
  rate numeric;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  if not exists (
    select 1 from business_os.exchange_rate_datasets d
    where d.id = dataset_id and d.organization_id = org_id
  ) then
    raise exception 'dataset_missing' using errcode = '22023';
  end if;
  rate := business_os.parse_rate(rate_text);
  insert into business_os.exchange_rates (
    organization_id, dataset_id, base_code, quote_currency, rate, effective_at
  ) values (
    org_id, dataset_id, base_code, quote_currency, rate, effective_at
  )
  on conflict on constraint exchange_rates_slot_key do update
    set rate = excluded.rate,
        fetched_at = clock_timestamp()
  returning id into rate_id;
  return rate_id;
end;
$fn$;

create function business_os.lock_period(
  actor_id uuid,
  period_start date,
  period_end date,
  basis text,
  formula_version text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  lock_id uuid;
  coverage text;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  if period_end < period_start then
    raise exception 'period_invalid' using errcode = '22023';
  end if;
  if basis not in ('purchase', 'earned_management', 'settled_cash', 'sms_legacy') then
    raise exception 'basis_invalid' using errcode = '22023';
  end if;
  if formula_version !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    raise exception 'formula_invalid' using errcode = '22023';
  end if;
  if exists (
    select 1 from business_os.financial_entries e
    where e.organization_id = org_id
      and e.status = 'pending_valuation'
  ) then
    coverage := 'partial';
  else
    coverage := 'complete';
  end if;
  insert into business_os.period_locks (
    organization_id, period_start, period_end, basis, formula_version, locked_by
  ) values (
    org_id, period_start, period_end, basis, formula_version, actor_id
  ) returning id into lock_id;
  insert into business_os.report_snapshots (
    organization_id, period_lock_id, basis, period_start, period_end, formula_version, coverage
  ) values (
    org_id, lock_id, basis, period_start, period_end, formula_version, coverage
  );
  insert into business_os.finance_events (organization_id, actor_user_id, action, subject)
  values (org_id, actor_id, 'lock_period', lock_id::text);
  return lock_id;
end;
$fn$;

create function business_os.reopen_period(actor_id uuid, lock_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
begin
  if reason is null or char_length(btrim(reason)) = 0 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  org_id := business_os.assert_finance_writer(actor_id);
  update business_os.period_locks
  set reopened_at = clock_timestamp(),
      reopen_reason = btrim(reason),
      reopened_by = actor_id
  where id = lock_id
    and organization_id = org_id
    and reopened_at is null;
  if not found then
    raise exception 'period_invalid' using errcode = '22023';
  end if;
  insert into business_os.finance_events (organization_id, actor_user_id, action, subject, reason)
  values (org_id, actor_id, 'reopen_period', lock_id::text, btrim(reason));
end;
$fn$;

create function business_os.project_profit(
  actor_id uuid,
  project_slug text,
  from_ts timestamptz,
  to_ts timestamptz
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  project uuid;
  revenue_net numeric := 0;
  cogs_net numeric := 0;
  project_opex numeric := 0;
  allocation numeric := 0;
  company_cost numeric := 0;
  profit_before numeric;
  profit_after numeric;
  incomplete boolean;
  non_gbp_allocation boolean;
begin
  org_id := business_os.assert_finance_writer(actor_id);
  select p.id into project
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = project_slug;
  if project is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;

  select coalesce(sum(case when l.side = 'credit' then l.gbp_amount else -l.gbp_amount end), 0)
    into revenue_net
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = org_id
    and e.status = 'posted'
    and l.project_id = project
    and a.kind = 'revenue'
    and e.kind <> 'reversal'
    and e.effective_at >= from_ts
    and e.effective_at < to_ts;

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into cogs_net
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = org_id
    and e.status = 'posted'
    and l.project_id = project
    and a.kind = 'cogs'
    and e.kind <> 'reversal'
    and e.effective_at >= from_ts
    and e.effective_at < to_ts;

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into project_opex
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  where e.organization_id = org_id
    and e.status = 'posted'
    and l.project_id = project
    and a.kind = 'opex'
    and e.kind <> 'reversal'
    and e.effective_at >= from_ts
    and e.effective_at < to_ts;

  select coalesce(sum(al.amount), 0), coalesce(bool_or(x.currency <> 'GBP'), false)
    into allocation, non_gbp_allocation
  from business_os.expense_allocations al
  join business_os.expenses x on x.id = al.expense_id
  join business_os.financial_entries e on e.id = x.posted_entry_id
  where al.project_id = project
    and x.source_owner = 'simnetiq'
    and x.status = 'posted'
    and e.status = 'posted'
    and e.effective_at >= from_ts
    and e.effective_at < to_ts;

  select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)
    into company_cost
  from business_os.financial_lines l
  join business_os.financial_entries e on e.id = l.entry_id
  join business_os.financial_accounts a on a.id = l.account_id
  join business_os.expenses x on x.posted_entry_id = e.id
  where x.organization_id = org_id
    and x.source_owner = 'simnetiq'
    and x.workflow_kind = 'expense'
    and a.kind = 'opex'
    and e.status = 'posted'
    and e.kind <> 'reversal'
    and e.effective_at >= from_ts
    and e.effective_at < to_ts;

  profit_before := revenue_net - cogs_net - project_opex;
  incomplete := non_gbp_allocation or exists (
    select 1 from business_os.financial_entries e
    where e.organization_id = org_id
      and e.status = 'pending_valuation'
      and e.effective_at >= from_ts
      and e.effective_at < to_ts
  ) or exists (
    select 1 from business_os.expenses x
    join business_os.financial_entries e on e.id = x.posted_entry_id
    where x.organization_id = org_id
      and x.status = 'posted'
      and x.tax_amount is null
      and e.effective_at >= from_ts
      and e.effective_at < to_ts
  );

  if non_gbp_allocation then
    profit_after := null;
  else
    profit_after := profit_before - allocation;
  end if;

  return jsonb_build_object(
    'profit_before', business_os.money_text(profit_before),
    'allocation', business_os.money_text(allocation),
    'profit_after', business_os.money_text(profit_after),
    'company_cost', business_os.money_text(company_cost),
    'net_sales', business_os.money_text(revenue_net),
    'net_profit', case when incomplete then null else business_os.money_text(profit_after) end,
    'margin', case
      when incomplete or revenue_net <= 0 or profit_after is null then null
      else business_os.money_text(round(profit_after / revenue_net, 4))
    end,
    'coverage', case when incomplete then 'partial' else 'complete' end
  );
end;
$fn$;

create function business_os.reject_immutable_line()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if exists (
    select 1 from business_os.financial_entries e
    where e.id = old.entry_id
      and e.status in ('posted', 'reversed', 'pending_valuation')
  ) then
    raise exception 'posted_line_immutable' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$fn$;

create trigger financial_lines_immutable
before update or delete on business_os.financial_lines
for each row execute function business_os.reject_immutable_line();

create function business_os.reject_observation_rewrite()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' then
    raise exception 'observation_immutable' using errcode = '42501';
  end if;
  if new.original_amount is distinct from old.original_amount
     or new.content_hash is distinct from old.content_hash
     or new.economic_transaction_id is distinct from old.economic_transaction_id
     or new.central_gbp_amount is distinct from old.central_gbp_amount
     or new.counts_as_new_revenue is distinct from old.counts_as_new_revenue then
    raise exception 'observation_immutable' using errcode = '42501';
  end if;
  return new;
end;
$fn$;

create trigger source_observations_immutable
before update or delete on business_os.source_observations
for each row execute function business_os.reject_observation_rewrite();

create function business_os.reject_posted_expense_rewrite()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'DELETE' and old.status <> 'draft' then
    raise exception 'posted_line_immutable' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.source_owner = 'project' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.status <> 'draft' and (
    new.amount is distinct from old.amount
    or new.currency is distinct from old.currency
    or new.vendor is distinct from old.vendor
    or new.tax_amount is distinct from old.tax_amount
  ) then
    raise exception 'posted_line_immutable' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$fn$;

create trigger expenses_immutable
before update or delete on business_os.expenses
for each row execute function business_os.reject_posted_expense_rewrite();

create function business_os.reject_entry_delete()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if old.status <> 'draft' then
    raise exception 'posted_line_immutable' using errcode = '42501';
  end if;
  return old;
end;
$fn$;

create trigger financial_entries_no_delete
before delete on business_os.financial_entries
for each row execute function business_os.reject_entry_delete();

alter table business_os.legal_entities enable row level security;
alter table business_os.legal_entities force row level security;
alter table business_os.financial_accounts enable row level security;
alter table business_os.financial_accounts force row level security;
alter table business_os.expense_categories enable row level security;
alter table business_os.expense_categories force row level security;
alter table business_os.exchange_rate_datasets enable row level security;
alter table business_os.exchange_rate_datasets force row level security;
alter table business_os.exchange_rates enable row level security;
alter table business_os.exchange_rates force row level security;
alter table business_os.expenses enable row level security;
alter table business_os.expenses force row level security;
alter table business_os.financial_entries enable row level security;
alter table business_os.financial_entries force row level security;
alter table business_os.source_observations enable row level security;
alter table business_os.source_observations force row level security;
alter table business_os.financial_lines enable row level security;
alter table business_os.financial_lines force row level security;
alter table business_os.expense_allocations enable row level security;
alter table business_os.expense_allocations force row level security;
alter table business_os.expense_receipts enable row level security;
alter table business_os.expense_receipts force row level security;
alter table business_os.balance_snapshots enable row level security;
alter table business_os.balance_snapshots force row level security;
alter table business_os.settlements enable row level security;
alter table business_os.settlements force row level security;
alter table business_os.period_locks enable row level security;
alter table business_os.period_locks force row level security;
alter table business_os.report_snapshots enable row level security;
alter table business_os.report_snapshots force row level security;
alter table business_os.finance_events enable row level security;
alter table business_os.finance_events force row level security;

create policy legal_entities_select on business_os.legal_entities
for select to authenticated using (business_os.is_active_member(organization_id));
create policy financial_accounts_select on business_os.financial_accounts
for select to authenticated using (business_os.is_active_member(organization_id));
create policy expense_categories_select on business_os.expense_categories
for select to authenticated using (business_os.is_active_member(organization_id));
create policy exchange_rate_datasets_select on business_os.exchange_rate_datasets
for select to authenticated using (business_os.is_active_member(organization_id));
create policy exchange_rates_select on business_os.exchange_rates
for select to authenticated using (business_os.is_active_member(organization_id));
create policy expenses_select on business_os.expenses
for select to authenticated using (business_os.is_active_member(organization_id));
create policy financial_entries_select on business_os.financial_entries
for select to authenticated using (business_os.is_active_member(organization_id));
create policy source_observations_select on business_os.source_observations
for select to authenticated using (business_os.is_active_member(organization_id));
create policy financial_lines_select on business_os.financial_lines
for select to authenticated using (business_os.is_active_member(organization_id));
create policy expense_allocations_select on business_os.expense_allocations
for select to authenticated using (business_os.is_active_member(organization_id));
create policy expense_receipts_select on business_os.expense_receipts
for select to authenticated using (business_os.is_active_member(organization_id));
create policy balance_snapshots_select on business_os.balance_snapshots
for select to authenticated using (business_os.is_active_member(organization_id));
create policy settlements_select on business_os.settlements
for select to authenticated using (business_os.is_active_member(organization_id));
create policy period_locks_select on business_os.period_locks
for select to authenticated using (business_os.is_active_member(organization_id));
create policy report_snapshots_select on business_os.report_snapshots
for select to authenticated using (business_os.is_active_member(organization_id));
create policy finance_events_select on business_os.finance_events
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on
  business_os.legal_entities,
  business_os.financial_accounts,
  business_os.expense_categories,
  business_os.exchange_rate_datasets,
  business_os.exchange_rates,
  business_os.expenses,
  business_os.financial_entries,
  business_os.source_observations,
  business_os.financial_lines,
  business_os.expense_allocations,
  business_os.expense_receipts,
  business_os.balance_snapshots,
  business_os.settlements,
  business_os.period_locks,
  business_os.report_snapshots,
  business_os.finance_events
from public, anon;
grant select on
  business_os.legal_entities,
  business_os.financial_accounts,
  business_os.expense_categories,
  business_os.exchange_rate_datasets,
  business_os.exchange_rates,
  business_os.expenses,
  business_os.financial_entries,
  business_os.source_observations,
  business_os.financial_lines,
  business_os.expense_allocations,
  business_os.expense_receipts,
  business_os.balance_snapshots,
  business_os.settlements,
  business_os.period_locks,
  business_os.report_snapshots,
  business_os.finance_events
to authenticated;
revoke insert, update, delete, truncate on
  business_os.legal_entities,
  business_os.financial_accounts,
  business_os.expense_categories,
  business_os.exchange_rate_datasets,
  business_os.exchange_rates,
  business_os.expenses,
  business_os.financial_entries,
  business_os.source_observations,
  business_os.financial_lines,
  business_os.expense_allocations,
  business_os.expense_receipts,
  business_os.balance_snapshots,
  business_os.settlements,
  business_os.period_locks,
  business_os.report_snapshots,
  business_os.finance_events
from authenticated;

revoke all on function business_os.money_text(numeric) from public, anon, authenticated;
revoke all on function business_os.fiat_scale(text) from public, anon, authenticated;
revoke all on function business_os.parse_amount(text, text, text, text) from public, anon, authenticated;
revoke all on function business_os.parse_rate(text) from public, anon, authenticated;
revoke all on function business_os.assert_finance_writer(uuid) from public, anon, authenticated;
revoke all on function business_os.reject_json_number(jsonb, text) from public, anon, authenticated;
revoke all on function business_os.period_is_locked(uuid, timestamptz) from public, anon, authenticated;
revoke all on function business_os.resolve_gbp(uuid, text, text, timestamptz, numeric) from public, anon, authenticated;
revoke all on function business_os.create_journal_entry(uuid, uuid, uuid, uuid, text, text, boolean, timestamptz, text, text, text, text, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.observation_result(uuid) from public, anon, authenticated;
revoke all on function business_os.post_source_observation(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.parse_date(text) from public, anon, authenticated;
revoke all on function business_os.reverse_entry(uuid, uuid, text) from public, anon, authenticated;
revoke all on function business_os.void_source_observation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function business_os.replace_source_observation(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.draft_manual_entry(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.update_manual_draft(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.post_manual_entry(uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.allocate_shared_expense(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.post_movement(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.record_balance_snapshot(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.record_settlement(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.register_fx_dataset(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.insert_exchange_rate(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function business_os.lock_period(uuid, date, date, text, text) from public, anon, authenticated;
revoke all on function business_os.reopen_period(uuid, uuid, text) from public, anon, authenticated;
revoke all on function business_os.project_profit(uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function business_os.reject_immutable_line() from public, anon, authenticated;
revoke all on function business_os.reject_observation_rewrite() from public, anon, authenticated;
revoke all on function business_os.reject_posted_expense_rewrite() from public, anon, authenticated;
revoke all on function business_os.reject_entry_delete() from public, anon, authenticated;

grant execute on function business_os.post_source_observation(uuid, jsonb) to service_role;
grant execute on function business_os.observation_result(uuid) to service_role;
grant execute on function business_os.reverse_entry(uuid, uuid, text) to service_role;
grant execute on function business_os.void_source_observation(uuid, uuid, text) to service_role;
grant execute on function business_os.replace_source_observation(uuid, uuid, jsonb) to service_role;
grant execute on function business_os.draft_manual_entry(uuid, jsonb) to service_role;
grant execute on function business_os.update_manual_draft(uuid, uuid, jsonb) to service_role;
grant execute on function business_os.post_manual_entry(uuid, uuid) to service_role;
grant execute on function business_os.allocate_shared_expense(uuid, uuid, jsonb) to service_role;
grant execute on function business_os.post_movement(uuid, jsonb) to service_role;
grant execute on function business_os.record_balance_snapshot(uuid, jsonb) to service_role;
grant execute on function business_os.record_settlement(uuid, jsonb) to service_role;
grant execute on function business_os.register_fx_dataset(uuid, text, text) to service_role;
grant execute on function business_os.insert_exchange_rate(uuid, uuid, text, text, text, timestamptz) to service_role;
grant execute on function business_os.lock_period(uuid, date, date, text, text) to service_role;
grant execute on function business_os.reopen_period(uuid, uuid, text) to service_role;
grant execute on function business_os.project_profit(uuid, text, timestamptz, timestamptz) to service_role;
