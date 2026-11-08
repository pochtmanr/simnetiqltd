-- Direct providers, part 1: the company bank account (Revolut Business).
--
-- Bank rows are cash movements, never sales: nothing here posts to the ledger.
-- Each Revolut transaction leg is one row (an exchange or an own-account transfer
-- has two), keyed by "<transaction id>:<leg id>" so a re-pull upserts in place.
-- Categories are slugs chosen in lib/business-os/bank/categories.ts. A category
-- set by hand is never overwritten by a rule or a re-pull.
--
-- Provider tokens are AES-256-GCM sealed by the server (BUSINESS_OS_TOKEN_KEY)
-- before they reach the database; no API role can read them.
-- Every write goes through a function, executable by service_role only.

create table business_os.provider_tokens (
  organization_id uuid not null references business_os.organizations (id),
  provider text not null check (provider in ('revolut')),
  sealed text not null check (sealed ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'),
  connected_by uuid not null,
  connected_at timestamptz not null default now(),
  primary key (organization_id, provider)
);

create table business_os.provider_runs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references business_os.organizations (id),
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  outcome text not null check (outcome ~ '^[a-z][a-z0-9_]{1,40}$'),
  rows_written integer not null default 0 check (rows_written >= 0)
);

create index provider_runs_recent_idx on business_os.provider_runs (organization_id, provider, finished_at desc);

create table business_os.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  provider text not null check (provider in ('revolut')),
  external_id text not null check (char_length(external_id) between 1 and 100),
  name text,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  balance numeric not null,
  state text not null,
  as_of timestamptz not null,
  unique (organization_id, provider, external_id)
);

create table business_os.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  provider text not null check (provider in ('revolut')),
  external_id text not null check (char_length(external_id) between 1 and 200),
  account_id uuid not null references business_os.bank_accounts (id),
  kind text not null,
  state text not null,
  created_at timestamptz not null,
  completed_at timestamptz,
  amount numeric not null,
  fee numeric not null default 0,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  balance_after numeric,
  description text,
  counterparty text,
  reference text,
  category text check (category ~ '^[a-z][a-z0-9_]{1,40}$'),
  category_source text check (category_source in ('rule', 'manual')),
  raw jsonb not null,
  updated_at timestamptz not null default now(),
  check ((category is null) = (category_source is null)),
  unique (organization_id, provider, external_id)
);

create index bank_transactions_org_time_idx on business_os.bank_transactions (organization_id, created_at desc);
create index bank_transactions_account_idx on business_os.bank_transactions (account_id, created_at desc);

create table business_os.bank_category_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  match text not null check (match = lower(btrim(match)) and char_length(match) between 2 and 80),
  category text not null check (category ~ '^[a-z][a-z0-9_]{1,40}$'),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, match)
);

alter table business_os.provider_tokens enable row level security;
alter table business_os.provider_tokens force row level security;
alter table business_os.provider_runs enable row level security;
alter table business_os.provider_runs force row level security;
alter table business_os.bank_accounts enable row level security;
alter table business_os.bank_accounts force row level security;
alter table business_os.bank_transactions enable row level security;
alter table business_os.bank_transactions force row level security;
alter table business_os.bank_category_rules enable row level security;
alter table business_os.bank_category_rules force row level security;

create policy provider_runs_select on business_os.provider_runs
for select to authenticated using (business_os.is_active_member(organization_id));
create policy bank_accounts_select on business_os.bank_accounts
for select to authenticated using (business_os.is_active_member(organization_id));
create policy bank_transactions_select on business_os.bank_transactions
for select to authenticated using (business_os.is_active_member(organization_id));
create policy bank_category_rules_select on business_os.bank_category_rules
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on business_os.provider_tokens, business_os.provider_runs, business_os.bank_accounts,
  business_os.bank_transactions, business_os.bank_category_rules from public, anon, authenticated;
grant select on business_os.provider_runs, business_os.bank_accounts, business_os.bank_transactions,
  business_os.bank_category_rules to authenticated;

-- Members see whether a provider is connected, never the token: a column grant leaves `sealed` unreadable.
create policy provider_tokens_select on business_os.provider_tokens
for select to authenticated using (business_os.is_active_member(organization_id));
grant select (organization_id, provider, connected_at) on business_os.provider_tokens to authenticated;

/* ---------- Connection (owner) ---------- */

create function business_os.save_provider_token(actor_id uuid, target_provider text, sealed_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_owner(actor_id);
  insert into business_os.provider_tokens (organization_id, provider, sealed, connected_by)
  values (org_id, target_provider, sealed_token, actor_id)
  on conflict (organization_id, provider) do update
    set sealed = excluded.sealed, connected_by = excluded.connected_by, connected_at = now();
  return jsonb_build_object('provider', target_provider, 'connected', true);
end;
$fn$;

create function business_os.disconnect_provider(actor_id uuid, target_provider text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_owner(actor_id);
  delete from business_os.provider_tokens where organization_id = org_id and provider = target_provider;
  return jsonb_build_object('provider', target_provider, 'connected', false);
end;
$fn$;

/* ---------- Sync (server job) ---------- */

-- Everything the job needs to pull one provider: the sealed token and where to resume.
create function business_os.provider_sync_state(target_provider text)
returns table (organization_id uuid, sealed text, newest_created_at timestamptz, oldest_pending_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    t.organization_id,
    t.sealed,
    (select max(x.created_at) from business_os.bank_transactions x where x.organization_id = t.organization_id and x.provider = t.provider),
    (select min(x.created_at) from business_os.bank_transactions x where x.organization_id = t.organization_id and x.provider = t.provider and x.state in ('created', 'pending'))
  from business_os.provider_tokens t
  where t.provider = target_provider
$fn$;

-- First rule (longest match, then oldest) whose text appears in the row's counterparty, description or reference.
create function business_os.bank_rule_category(org_id uuid, haystack text)
returns text
language sql
stable
set search_path = ''
as $fn$
  select r.category
  from business_os.bank_category_rules r
  where r.organization_id = org_id
    and strpos(lower(coalesce(haystack, '')), r.match) > 0
  order by char_length(r.match) desc, r.created_at
  limit 1
$fn$;

/*
 * One page from the bank. `accounts` and `transactions` are arrays shaped by
 * lib/business-os/providers/revolut.ts. Transactions are upserted by external id:
 * state, amounts and text follow the bank; a category is set by rules on first
 * sight only (falling back to the page's `default_category`, e.g. own-account
 * transfers) and is never touched again by a pull.
 */
create function business_os.ingest_bank_page(org_id uuid, target_provider text, accounts jsonb, transactions jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  item jsonb;
  account_uuid uuid;
  inserted integer := 0;
  updated integer := 0;
  was_insert boolean;
begin
  if jsonb_typeof(accounts) <> 'array' or jsonb_typeof(transactions) <> 'array' then
    raise exception 'page_invalid' using errcode = '22023';
  end if;
  if jsonb_array_length(transactions) > 5000 or jsonb_array_length(accounts) > 200 then
    raise exception 'page_too_large' using errcode = '22023';
  end if;

  for item in select jsonb_array_elements(accounts)
  loop
    insert into business_os.bank_accounts (organization_id, provider, external_id, name, currency, balance, state, as_of)
    values (org_id, target_provider, item ->> 'external_id', item ->> 'name', item ->> 'currency', (item ->> 'balance')::numeric, item ->> 'state', (item ->> 'as_of')::timestamptz)
    on conflict (organization_id, provider, external_id) do update
      set name = excluded.name, currency = excluded.currency, balance = excluded.balance, state = excluded.state, as_of = excluded.as_of;
  end loop;

  for item in select jsonb_array_elements(transactions)
  loop
    select a.id into account_uuid
    from business_os.bank_accounts a
    where a.organization_id = org_id and a.provider = target_provider and a.external_id = item ->> 'account_external_id';
    if account_uuid is null then
      raise exception 'account_missing' using errcode = '22023';
    end if;

    insert into business_os.bank_transactions as t (
      organization_id, provider, external_id, account_id, kind, state, created_at, completed_at,
      amount, fee, currency, balance_after, description, counterparty, reference, category, category_source, raw
    )
    values (
      org_id, target_provider, item ->> 'external_id', account_uuid, item ->> 'kind', item ->> 'state',
      (item ->> 'created_at')::timestamptz, (item ->> 'completed_at')::timestamptz,
      (item ->> 'amount')::numeric, coalesce((item ->> 'fee')::numeric, 0), item ->> 'currency',
      (item ->> 'balance_after')::numeric, item ->> 'description', item ->> 'counterparty', item ->> 'reference',
      coalesce(business_os.bank_rule_category(org_id, concat_ws(' ', item ->> 'counterparty', item ->> 'description', item ->> 'reference')), nullif(item ->> 'default_category', '')),
      case when coalesce(business_os.bank_rule_category(org_id, concat_ws(' ', item ->> 'counterparty', item ->> 'description', item ->> 'reference')), nullif(item ->> 'default_category', '')) is null then null else 'rule' end,
      coalesce(item -> 'raw', '{}'::jsonb)
    )
    on conflict (organization_id, provider, external_id) do update
      set account_id = excluded.account_id,
          kind = excluded.kind,
          state = excluded.state,
          completed_at = excluded.completed_at,
          amount = excluded.amount,
          fee = excluded.fee,
          currency = excluded.currency,
          balance_after = excluded.balance_after,
          description = excluded.description,
          counterparty = excluded.counterparty,
          reference = excluded.reference,
          raw = excluded.raw,
          updated_at = now()
    returning (xmax = 0) into was_insert;
    if was_insert then inserted := inserted + 1; else updated := updated + 1; end if;
  end loop;

  return jsonb_build_object('accounts', jsonb_array_length(accounts), 'inserted', inserted, 'updated', updated);
end;
$fn$;

create function business_os.record_provider_run(org_id uuid, target_provider text, run_started_at timestamptz, run_outcome text, run_rows integer)
returns void
language sql
security definer
set search_path = ''
as $fn$
  insert into business_os.provider_runs (organization_id, provider, started_at, outcome, rows_written)
  values (org_id, target_provider, run_started_at, run_outcome, greatest(coalesce(run_rows, 0), 0));
  delete from business_os.provider_runs r
  where r.organization_id = org_id and r.provider = target_provider
    and r.id not in (
      select r2.id from business_os.provider_runs r2
      where r2.organization_id = org_id and r2.provider = target_provider
      order by r2.finished_at desc limit 200
    );
$fn$;

/* ---------- Categorisation (owner or admin) ---------- */

-- Null clears the category, so rules may apply again on a later "apply rules".
create function business_os.set_bank_category(actor_id uuid, transaction_id uuid, new_category text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if new_category is not null and new_category !~ '^[a-z][a-z0-9_]{1,40}$' then
    raise exception 'category_invalid' using errcode = '22023';
  end if;
  update business_os.bank_transactions
    set category = new_category,
        category_source = case when new_category is null then null else 'manual' end,
        updated_at = now()
  where id = transaction_id and organization_id = org_id;
  if not found then
    raise exception 'transaction_missing' using errcode = '22023';
  end if;
  return jsonb_build_object('id', transaction_id, 'category', new_category);
end;
$fn$;

-- Adds (or retargets) a rule and categorises every uncategorised row it matches.
create function business_os.save_bank_rule(actor_id uuid, rule_match text, rule_category text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  clean text := lower(btrim(coalesce(rule_match, '')));
  rule_id uuid;
  applied integer;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if char_length(clean) not between 2 and 80 then
    raise exception 'rule_invalid' using errcode = '22023';
  end if;
  if rule_category is null or rule_category !~ '^[a-z][a-z0-9_]{1,40}$' then
    raise exception 'category_invalid' using errcode = '22023';
  end if;
  insert into business_os.bank_category_rules (organization_id, match, category, created_by)
  values (org_id, clean, rule_category, actor_id)
  on conflict (organization_id, match) do update set category = excluded.category
  returning id into rule_id;

  update business_os.bank_transactions t
    set category = business_os.bank_rule_category(org_id, concat_ws(' ', t.counterparty, t.description, t.reference)),
        category_source = 'rule',
        updated_at = now()
  where t.organization_id = org_id
    and (t.category is null or t.category_source = 'rule')
    and business_os.bank_rule_category(org_id, concat_ws(' ', t.counterparty, t.description, t.reference)) is not null
    and t.category is distinct from business_os.bank_rule_category(org_id, concat_ws(' ', t.counterparty, t.description, t.reference));
  get diagnostics applied = row_count;
  return jsonb_build_object('id', rule_id, 'match', clean, 'category', rule_category, 'applied', applied);
end;
$fn$;

-- Removes a rule. Rows it categorised keep their category until changed by hand or by another rule.
create function business_os.delete_bank_rule(actor_id uuid, rule_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  delete from business_os.bank_category_rules where id = rule_id and organization_id = org_id;
  if not found then
    raise exception 'rule_missing' using errcode = '22023';
  end if;
  return jsonb_build_object('id', rule_id, 'deleted', true);
end;
$fn$;

revoke all on function business_os.save_provider_token(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.disconnect_provider(uuid, text) from public, anon, authenticated;
revoke all on function business_os.provider_sync_state(text) from public, anon, authenticated;
revoke all on function business_os.bank_rule_category(uuid, text) from public, anon, authenticated;
revoke all on function business_os.ingest_bank_page(uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function business_os.record_provider_run(uuid, text, timestamptz, text, integer) from public, anon, authenticated;
revoke all on function business_os.set_bank_category(uuid, uuid, text) from public, anon, authenticated;
revoke all on function business_os.save_bank_rule(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.delete_bank_rule(uuid, uuid) from public, anon, authenticated;
grant execute on function business_os.save_provider_token(uuid, text, text) to service_role;
grant execute on function business_os.disconnect_provider(uuid, text) to service_role;
grant execute on function business_os.provider_sync_state(text) to service_role;
grant execute on function business_os.ingest_bank_page(uuid, text, jsonb, jsonb) to service_role;
grant execute on function business_os.record_provider_run(uuid, text, timestamptz, text, integer) to service_role;
grant execute on function business_os.set_bank_category(uuid, uuid, text) to service_role;
grant execute on function business_os.save_bank_rule(uuid, text, text) to service_role;
grant execute on function business_os.delete_bank_rule(uuid, uuid) to service_role;
