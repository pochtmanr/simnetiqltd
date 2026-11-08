import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name: string) => readFileSync(join(root, "supabase/business-os/migrations", name), "utf8");
const chain = [
  "20260929120000_identity_foundation.sql",
  "20260929150000_finance_core.sql",
  "20260929180000_project_pulls.sql",
  "20260929210000_reconciliation.sql",
  "20260929240000_documents_registry.sql",
  "20261108120000_files_folders.sql",
  "20261108130000_brain.sql",
  "20261108140000_bank.sql",
].map(read);

const OWNER = "00000000-0000-4000-8000-000000000001";
const ADMIN = "00000000-0000-4000-8000-000000000002";
const READER = "00000000-0000-4000-8000-000000000003";
const SEALED = "v1.aaaa.bbbb.cccc";

async function setup(): Promise<{ db: PGlite; org: string }> {
  const db = new PGlite();
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
    create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
    end $$;
    create schema if not exists storage;
    create table if not exists storage.buckets (id text primary key, name text not null, public boolean not null default false, file_size_limit bigint);
    create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null, name text);
  `);
  for (const sql of chain) await db.exec(sql);
  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'o@example.test'), ('${ADMIN}', 'a@example.test'), ('${READER}', 'r@example.test');
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OWNER}', 'owner' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${ADMIN}', 'admin' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${READER}', 'read_only' from business_os.organizations;
  `);
  const org = (await db.query<{ id: string }>(`select id from business_os.organizations limit 1`)).rows[0].id;
  return { db, org };
}

const account = { external_id: "acc-gbp", name: "Main", currency: "GBP", balance: "1520.40", state: "active", as_of: "2026-11-08T10:00:00Z" };

function tx(id: string, extra: Record<string, unknown> = {}) {
  return {
    external_id: `${id}:leg1`,
    account_external_id: "acc-gbp",
    kind: "card_payment",
    state: "completed",
    created_at: "2026-11-01T09:00:00Z",
    completed_at: "2026-11-01T09:05:00Z",
    amount: "-42.50",
    fee: "0",
    currency: "GBP",
    balance_after: "1520.40",
    description: "To Microsoft Azure",
    counterparty: "Microsoft Azure",
    reference: null,
    raw: { id },
    ...extra,
  };
}

async function ingest(db: PGlite, org: string, transactions: unknown[], accounts: unknown[] = [account]) {
  const result = await db.query<{ r: { inserted: number; updated: number } }>(`select business_os.ingest_bank_page($1, 'revolut', $2::jsonb, $3::jsonb) as r`, [
    org,
    JSON.stringify(accounts),
    JSON.stringify(transactions),
  ]);
  return result.rows[0].r;
}

test("bank: ingest upserts by external id and keeps the bank's latest state", async () => {
  const { db, org } = await setup();
  assert.deepEqual(await ingest(db, org, [tx("t1", { state: "pending", completed_at: null }), tx("t2")]), { accounts: 1, inserted: 2, updated: 0 });
  assert.deepEqual(await ingest(db, org, [tx("t1")]), { accounts: 1, inserted: 0, updated: 1 });
  const rows = await db.query<{ external_id: string; state: string; amount: string }>(
    `select external_id, state, amount::text as amount from business_os.bank_transactions order by external_id`,
  );
  assert.deepEqual(rows.rows, [
    { external_id: "t1:leg1", state: "completed", amount: "-42.50" },
    { external_id: "t2:leg1", state: "completed", amount: "-42.50" },
  ]);
  await assert.rejects(() => ingest(db, org, [tx("t3", { account_external_id: "nope" })]), /account_missing/);
  await db.close();
});

test("bank: rules categorise new rows; manual categories survive rules and re-pulls", async () => {
  const { db, org } = await setup();
  await ingest(db, org, [tx("t1"), tx("t2", { counterparty: "Apple", description: "App Store payout", amount: "310.00" })]);

  const rule = await db.query<{ r: { applied: number } }>(`select business_os.save_bank_rule($1, '  AZURE ', 'hosting') as r`, [ADMIN]);
  assert.equal(rule.rows[0].r.applied, 1);

  const azure = (await db.query<{ id: string }>(`select id from business_os.bank_transactions where external_id = 't1:leg1'`)).rows[0].id;
  await db.query(`select business_os.set_bank_category($1, $2, 'software')`, [ADMIN, azure]);
  await ingest(db, org, [tx("t1"), tx("t4")]);

  const rows = await db.query<{ external_id: string; category: string | null; category_source: string | null }>(
    `select external_id, category, category_source from business_os.bank_transactions order by external_id`,
  );
  assert.deepEqual(rows.rows, [
    { external_id: "t1:leg1", category: "software", category_source: "manual" },
    { external_id: "t2:leg1", category: null, category_source: null },
    { external_id: "t4:leg1", category: "hosting", category_source: "rule" },
  ]);

  // A longer, more specific rule wins over a shorter one for rule-set rows.
  await db.query(`select business_os.save_bank_rule($1, 'microsoft azure', 'cloud')`, [ADMIN]);
  const t4 = await db.query<{ category: string }>(`select category from business_os.bank_transactions where external_id = 't4:leg1'`);
  assert.equal(t4.rows[0].category, "cloud");

  await assert.rejects(() => db.query(`select business_os.save_bank_rule($1, 'x', 'hosting')`, [ADMIN]), /rule_invalid/);
  await assert.rejects(() => db.query(`select business_os.set_bank_category($1, $2, 'Bad Cat')`, [ADMIN, azure]), /category_invalid/);
  await assert.rejects(() => db.query(`select business_os.set_bank_category($1, $2, 'hosting')`, [READER, azure]), /reader_forbidden/);
  await db.close();
});

test("bank: a page's default category applies when no rule matches, and a rule beats it", async () => {
  const { db, org } = await setup();
  await db.query(`select business_os.save_bank_rule($1, 'azure', 'hosting')`, [ADMIN]);
  await ingest(db, org, [tx("fx", { counterparty: null, description: "Exchanged to EUR", default_category: "internal_transfer" }), tx("az", { default_category: "internal_transfer" })]);
  const rows = await db.query<{ external_id: string; category: string; category_source: string }>(
    `select external_id, category, category_source from business_os.bank_transactions order by external_id`,
  );
  assert.deepEqual(rows.rows, [
    { external_id: "az:leg1", category: "hosting", category_source: "rule" },
    { external_id: "fx:leg1", category: "internal_transfer", category_source: "rule" },
  ]);
  await db.close();
});

test("bank: tokens are owner-only and never readable by members", async () => {
  const { db, org } = await setup();
  await assert.rejects(() => db.query(`select business_os.save_provider_token($1, 'revolut', $2)`, [ADMIN, SEALED]), /owner_required/);
  await db.query(`select business_os.save_provider_token($1, 'revolut', $2)`, [OWNER, SEALED]);
  const state = await db.query<{ organization_id: string; sealed: string }>(`select organization_id, sealed from business_os.provider_sync_state('revolut')`);
  assert.deepEqual(state.rows, [{ organization_id: org, sealed: SEALED }]);
  await assert.rejects(() => db.query(`select business_os.save_provider_token($1, 'revolut', 'plain-token')`, [OWNER]), /check/);

  const privileges = await db.query<{ sealed: boolean; connected: boolean }>(
    `select has_column_privilege('authenticated', 'business_os.provider_tokens', 'sealed', 'select') as sealed,
            has_column_privilege('authenticated', 'business_os.provider_tokens', 'connected_at', 'select') as connected`,
  );
  assert.deepEqual(privileges.rows[0], { sealed: false, connected: true });

  await db.query(`select business_os.disconnect_provider($1, 'revolut')`, [OWNER]);
  assert.equal((await db.query(`select 1 from business_os.provider_tokens`)).rows.length, 0);
  await db.close();
});

test("bank: writes go through functions only; api roles cannot call them", async () => {
  const { db } = await setup();
  const grants = await db.query<{ name: string; anon: boolean; authenticated: boolean; service: boolean }>(`
    select p.proname as name,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
      has_function_privilege('service_role', p.oid, 'execute') as service
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'business_os' and p.proname in (
      'save_provider_token', 'disconnect_provider', 'provider_sync_state', 'ingest_bank_page',
      'record_provider_run', 'set_bank_category', 'save_bank_rule', 'delete_bank_rule')`);
  assert.equal(grants.rows.length, 8);
  for (const row of grants.rows) assert.deepEqual([row.anon, row.authenticated, row.service], [false, false, true], row.name);
  for (const table of ["bank_transactions", "bank_accounts", "bank_category_rules", "provider_runs"]) {
    const access = await db.query<{ insert: boolean; select: boolean }>(
      `select has_table_privilege('authenticated', 'business_os.${table}', 'insert') as insert, has_table_privilege('authenticated', 'business_os.${table}', 'select') as select`,
    );
    assert.deepEqual(access.rows[0], { insert: false, select: true }, table);
  }
  await db.close();
});

test("bank: provider runs keep the newest 200", async () => {
  const { db, org } = await setup();
  for (let index = 0; index < 205; index += 1) {
    await db.query(`select business_os.record_provider_run($1, 'revolut', now(), 'committed', $2)`, [org, index]);
  }
  const count = await db.query<{ n: number }>(`select count(*)::int as n from business_os.provider_runs`);
  assert.equal(count.rows[0].n, 200);
  await db.close();
});
