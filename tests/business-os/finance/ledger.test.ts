import assert from "node:assert/strict";
import test from "node:test";
import exponents from "../../../contracts/business-os/v1/currency-exponents.json";
import {
  adminId,
  financeSql,
  hash,
  identitySql,
  json,
  moneyIs,
  observation,
  ownerId,
  postObservation,
  queryAs,
  readerId,
  withLedger,
} from "./ledger.ts";

const range = ["2020-01-01T00:00:00.000Z", "2030-01-01T00:00:00.000Z"];

async function revenueFor(db: Awaited<ReturnType<typeof withLedger>>, externalId: string) {
  const rows = await db.query<{ net: string }>(
    `select coalesce(sum(case when l.side = 'credit' then l.gbp_amount else -l.gbp_amount end), 0)::text as net
     from business_os.financial_lines l
     join business_os.financial_entries e on e.id = l.entry_id
     join business_os.financial_accounts a on a.id = l.account_id
     join business_os.source_observations o on o.id = e.source_observation_id
     where a.kind = 'revenue' and e.status = 'posted' and e.kind <> 'reversal' and o.external_object_id = $1`,
    [externalId],
  );
  return rows.rows[0].net;
}

async function accountNet(db: Awaited<ReturnType<typeof withLedger>>, code: string) {
  const rows = await db.query<{ net: string }>(
    `select coalesce(sum(case when l.side = 'debit' then l.gbp_amount else -l.gbp_amount end), 0)::text as net
     from business_os.financial_lines l
     join business_os.financial_accounts a on a.id = l.account_id
     join business_os.financial_entries e on e.id = l.entry_id
     where a.code = $1 and e.status = 'posted' and e.kind <> 'reversal'`,
    [code],
  );
  return rows.rows[0].net;
}

test("finance migration matches fiat scales and keeps tax fields empty", async () => {
  const db = await withLedger();
  for (const [currency, scale] of Object.entries(exponents.exponents)) {
    const rows = await db.query<{ scale: number | null }>(`select business_os.fiat_scale($1) as scale`, [currency]);
    assert.equal(rows.rows[0].scale, scale);
  }
  const unknown = await db.query<{ scale: number | null }>(`select business_os.fiat_scale('XXX') as scale`);
  assert.equal(unknown.rows[0].scale, null);
  const legal = await db.query<{ empty: boolean }>(
    `select tax_reference is null and vat_status is null and fiscal_year_start is null as empty
     from business_os.legal_entities`,
  );
  assert.equal(legal.rows[0].empty, true);
  const columns = await db.query<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_schema = 'business_os' and table_name = 'expense_receipts'`,
  );
  assert.equal(columns.rows.some((row) => row.column_name.includes("url")), false);
  await db.close();
});

test("writers, aliases, fees, and duplicate origins post once", async () => {
  const db = await withLedger();
  await assert.rejects(
    () => postObservation(db, readerId, observation({ external_object_id: "reader", content_hash: hash(2) })),
    /reader_forbidden/,
  );
  const adminPosted = await postObservation(
    db,
    adminId,
    observation({ external_object_id: "admin-sale", economic_transaction_id: "econ-admin", content_hash: hash(3) }),
  );
  assert.equal(adminPosted.status, "posted");
  assert.equal(await moneyIs(db, await revenueFor(db, "admin-sale"), "10"), true);

  const original = await postObservation(
    db,
    ownerId,
    observation({ external_object_id: "sale-dup", economic_transaction_id: "econ-dup", content_hash: hash(4) }),
  );
  const replay = await postObservation(
    db,
    ownerId,
    observation({ external_object_id: "sale-dup", economic_transaction_id: "econ-dup", content_hash: hash(4) }),
  );
  assert.equal(replay.observation_id, original.observation_id);
  await assert.rejects(
    () =>
      postObservation(
        db,
        ownerId,
        observation({ external_object_id: "sale-dup", economic_transaction_id: "econ-dup", content_hash: hash(5) }),
      ),
    /duplicate_origin/,
  );
  await assert.rejects(
    () =>
      db.exec(`
        insert into business_os.source_observations (
          organization_id, project_id, environment, external_object_id, event_kind,
          external_adjustment_id, revision, record_type, observation_kind, recognition_basis,
          posting_role, economic_transaction_id, counts_as_new_revenue, quality, occurred_at,
          formula_version, content_hash, status, original_amount, original_currency
        )
        select organization_id, project_id, environment, external_object_id, event_kind,
          external_adjustment_id, revision, record_type, observation_kind, recognition_basis,
          posting_role, economic_transaction_id, false, quality, occurred_at,
          formula_version, content_hash, status, original_amount, original_currency
        from business_os.source_observations where external_object_id = 'sale-dup'
      `),
    /duplicate|unique/i,
  );

  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-alias",
      economic_transaction_id: "econ-alias",
      content_hash: hash(6),
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-alias-copy",
      economic_transaction_id: "econ-alias",
      content_hash: hash(7),
      posting_role: "alias",
      counts_as_new_revenue: true,
      alias_ids: ["sale-alias"],
    }),
  );
  assert.equal(await moneyIs(db, await revenueFor(db, "sale-alias"), "10"), true);
  const aliasEntry = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_entries e
     join business_os.source_observations o on o.id = e.source_observation_id
     where o.external_object_id = 'sale-alias-copy'`,
  );
  assert.equal(aliasEntry.rows[0].count, "0");
  await assert.rejects(
    () =>
      postObservation(
        db,
        ownerId,
        observation({
          external_object_id: "sale-alias-2",
          economic_transaction_id: "econ-alias",
          content_hash: hash(8),
        }),
      ),
    /duplicate_economic/,
  );

  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "fee-1",
      event_kind: "fee",
      record_type: "fee",
      economic_transaction_id: "econ-fee",
      counts_as_new_revenue: false,
      component_id: "component-1",
      content_hash: hash(9),
      debit_account: "fees-gbp",
      credit_account: "clearing-gbp",
      original_amount: "1.50",
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "fee-1-alias",
      event_kind: "fee",
      record_type: "fee",
      economic_transaction_id: "econ-fee-alias",
      counts_as_new_revenue: false,
      component_id: "component-1",
      posting_role: "alias",
      content_hash: hash(10),
      debit_account: "fees-gbp",
      credit_account: "clearing-gbp",
      original_amount: "1.50",
    }),
  );
  await assert.rejects(
    () =>
      postObservation(
        db,
        ownerId,
        observation({
          external_object_id: "fee-2",
          event_kind: "fee",
          record_type: "fee",
          economic_transaction_id: "econ-fee-2",
          counts_as_new_revenue: false,
          component_id: "component-1",
          content_hash: hash(11),
          debit_account: "fees-gbp",
          credit_account: "clearing-gbp",
          original_amount: "1.50",
        }),
      ),
    /duplicate_fee_component/,
  );
  const feeLines = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines l
     join business_os.financial_accounts a on a.id = l.account_id
     where a.kind = 'fees'`,
  );
  assert.equal(feeLines.rows[0].count, "1");

  await assert.rejects(
    () =>
      postObservation(db, ownerId, {
        ...observation({ external_object_id: "float", content_hash: hash(12), economic_transaction_id: "econ-float" }),
        original_amount: 10.1,
      }),
    /amount_invalid/,
  );

  const privileges = await db.query<{ name: string; allowed: boolean }>(`
    select 'authenticated' as name, has_function_privilege('authenticated', 'business_os.post_source_observation(uuid,jsonb)', 'execute') as allowed
    union all
    select 'service', has_function_privilege('service_role', 'business_os.post_source_observation(uuid,jsonb)', 'execute')
  `);
  const allowed = Object.fromEntries(privileges.rows.map((row) => [row.name, row.allowed]));
  assert.equal(allowed.authenticated, false);
  assert.equal(allowed.service, true);
  await assert.rejects(() =>
    queryAs(db, "authenticated", ownerId, `select business_os.post_source_observation($1::uuid, '{}'::jsonb)`, [ownerId]),
  );
  await assert.rejects(() => queryAs(db, "anon", null, `select * from business_os.financial_entries`));
  await db.close();
});

test("void and replacement reverse posted lines without deleting them", async () => {
  const db = await withLedger();
  const posted = await postObservation(
    db,
    ownerId,
    observation({ external_object_id: "sale-void", economic_transaction_id: "econ-void", content_hash: hash(20) }),
  );
  const before = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines l
     join business_os.financial_entries e on e.id = l.entry_id
     where e.source_observation_id = $1::uuid`,
    [posted.observation_id],
  );
  assert.ok(BigInt(before.rows[0].count) > 0n);
  await db.query(`select business_os.void_source_observation($1::uuid, $2::uuid, 'customer void')`, [
    ownerId,
    posted.observation_id,
  ]);
  assert.equal(await moneyIs(db, await revenueFor(db, "sale-void"), "0"), true);
  const after = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines l
     join business_os.financial_entries e on e.id = l.entry_id
     where e.source_observation_id = $1::uuid or e.reversal_of is not null`,
    [posted.observation_id],
  );
  assert.ok(BigInt(after.rows[0].count) >= BigInt(before.rows[0].count));
  await assert.rejects(
    () => db.query(`delete from business_os.financial_lines where entry_id = $1::uuid`, [posted.entry_id]),
    /posted_line_immutable/,
  );

  const replaced = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-replace",
      economic_transaction_id: "econ-replace",
      content_hash: hash(21),
      original_amount: "10.00",
    }),
  );
  await db.query(`select business_os.replace_source_observation($1::uuid, $2::uuid, $3::jsonb)`, [
    ownerId,
    replaced.observation_id,
    JSON.stringify(
      observation({
        external_object_id: "sale-replace",
        economic_transaction_id: "econ-replace",
        revision: 2,
        content_hash: hash(22),
        original_amount: "8.00",
        supersedes_revision: 1,
      }),
    ),
  ]);
  assert.equal(await moneyIs(db, await revenueFor(db, "sale-replace"), "8"), true);
  const kept = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines l
     join business_os.financial_entries e on e.id = l.entry_id
     join business_os.source_observations o on o.id = e.source_observation_id
     where o.external_object_id = 'sale-replace'`,
  );
  assert.ok(BigInt(kept.rows[0].count) >= 4n);
  await db.close();
});

test("top-up, consumption, payout, transfer, and opening balances are not revenue", async () => {
  const db = await withLedger();
  await db.query(`select business_os.post_movement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      kind: "top_up",
      recognition_basis: "purchase",
      amount: "100.00",
      currency: "GBP",
      debit_account: "prepaid-gbp",
      credit_account: "bank-gbp",
      effective_at: "2026-05-02T12:00:00.000Z",
      external_id: "topup-1",
      project_slug: "smscode",
    }),
  ]);
  await db.query(`select business_os.post_movement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      kind: "consumption",
      recognition_basis: "purchase",
      amount: "40.00",
      currency: "GBP",
      debit_account: "cogs-gbp",
      credit_account: "prepaid-gbp",
      effective_at: "2026-05-03T12:00:00.000Z",
      external_id: "use-1",
      project_slug: "smscode",
    }),
  ]);
  assert.equal(await moneyIs(db, await accountNet(db, "prepaid-gbp"), "60"), true);
  assert.equal(await moneyIs(db, await accountNet(db, "cogs-gbp"), "40"), true);
  assert.equal(await moneyIs(db, await accountNet(db, "bank-gbp"), "-100"), true);

  const payout = json<{ entry_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.post_movement($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({
          kind: "payout",
          recognition_basis: "settled_cash",
          amount: "80.00",
          currency: "GBP",
          debit_account: "bank-gbp",
          credit_account: "clearing-gbp",
          effective_at: "2026-05-04T12:00:00.000Z",
          external_id: "payout-1",
          project_slug: "doppler",
        }),
      ])
    ).rows[0].result,
  );
  const snapshot = await db.query<{ id: string }>(
    `select business_os.record_balance_snapshot($1::uuid, $2::jsonb) as id`,
    [
      ownerId,
      JSON.stringify({
        account_code: "bank-gbp",
        amount: "20.00",
        currency: "GBP",
        as_of: "2026-05-04T18:00:00.000Z",
        available_amount: "20.00",
        snapshot_kind: "cash",
      }),
    ],
  );
  assert.equal(typeof snapshot.rows[0].id, "string");
  await db.query(`select business_os.record_settlement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      project_slug: "doppler",
      external_payout_id: "payout-1",
      amount: "80.00",
      currency: "GBP",
      settled_at: "2026-05-04T18:00:00.000Z",
      entry_id: payout.entry_id,
    }),
  ]);
  const fee = await db.query<{ fee_amount: string | null; additive: boolean }>(
    `select s.fee_amount::text as fee_amount, b.additive
     from business_os.settlements s
     cross join business_os.balance_snapshots b
     where s.external_payout_id = 'payout-1'`,
  );
  assert.equal(fee.rows[0].fee_amount, null);
  assert.equal(fee.rows[0].additive, false);

  const transfer = json<{ entry_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.post_movement($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({
          kind: "transfer",
          recognition_basis: "settled_cash",
          amount: "5.00",
          currency: "GBP",
          debit_account: "wallet-ops-gbp",
          credit_account: "wallet-gbp",
          effective_at: "2026-05-05T12:00:00.000Z",
          external_id: "transfer-1",
          project_slug: "doppler",
        }),
      ])
    ).rows[0].result,
  );
  const revenueFlag = await db.query<{ counts: boolean }>(
    `select counts_as_new_revenue as counts from business_os.financial_entries where id = $1::uuid`,
    [transfer.entry_id],
  );
  assert.equal(revenueFlag.rows[0].counts, false);
  const revenue = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines l
     join business_os.financial_accounts a on a.id = l.account_id
     where a.kind = 'revenue'`,
  );
  assert.equal(revenue.rows[0].count, "0");
  await assert.rejects(
    () =>
      db.query(`select business_os.post_movement($1::uuid, $2::jsonb)`, [
        ownerId,
        JSON.stringify({
          kind: "opening_balance",
          recognition_basis: "settled_cash",
          amount: "1.00",
          currency: "GBP",
          debit_account: "bank-gbp",
          credit_account: "owner-funding-gbp",
          effective_at: "2026-01-01T00:00:00.000Z",
          external_id: "open-1",
          project_slug: "doppler",
        }),
      ]),
    /reason_required/,
  );
  await db.query(`select business_os.post_movement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      kind: "opening_balance",
      recognition_basis: "settled_cash",
      amount: "1.00",
      currency: "GBP",
      debit_account: "bank-gbp",
      credit_account: "owner-funding-gbp",
      effective_at: "2026-01-01T00:00:00.000Z",
      external_id: "open-1",
      project_slug: "doppler",
      provenance: "statement dated 2026-01-01",
    }),
  ]);
  await db.close();
});

test("one shared expense posts company cost once and allocations stay exact", async () => {
  const db = await withLedger();
  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-profit",
      economic_transaction_id: "econ-profit",
      content_hash: hash(30),
      original_amount: "100.00",
    }),
  );
  const drafted = json<{ expense_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.draft_manual_entry($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({
          workflow_kind: "expense",
          vendor: "Office",
          category: "overhead",
          due_on: "2026-06-01",
          service_on: "2026-06-01",
          amount: "30.00",
          currency: "GBP",
          tax_amount: "0.00",
          tax_inclusion: "inclusive",
          vat_recoverable: false,
        }),
      ])
    ).rows[0].result,
  );
  await db.query(`select business_os.post_manual_entry($1::uuid, $2::uuid)`, [ownerId, drafted.expense_id]);
  const before = await db.query<{ expenses: string; opex: string }>(
    `select
       (select count(*) from business_os.expenses where source_owner = 'simnetiq')::text as expenses,
       coalesce((select sum(l.gbp_amount) from business_os.financial_lines l
         join business_os.financial_accounts a on a.id = l.account_id
         join business_os.financial_entries e on e.id = l.entry_id
         where a.kind = 'opex' and l.side = 'debit' and e.status = 'posted' and e.kind <> 'reversal'), 0)::text as opex`,
  );
  const allocated = json<{ unallocated: string; allocations: { allocation_id: string }[] }>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.allocate_shared_expense($1::uuid, $2::uuid, $3::jsonb) as result`,
        [
          ownerId,
          drafted.expense_id,
          JSON.stringify([
            { project_slug: "doppler", amount: "12.00" },
            { project_slug: "smscode", amount: "10.00" },
          ]),
        ],
      )
    ).rows[0].result,
  );
  assert.equal(await moneyIs(db, allocated.unallocated, "8"), true);
  const again = json<{ allocations: { allocation_id: string }[] }>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.allocate_shared_expense($1::uuid, $2::uuid, $3::jsonb) as result`,
        [
          ownerId,
          drafted.expense_id,
          JSON.stringify([
            { project_slug: "doppler", amount: "12.00", allocation_id: allocated.allocations[0].allocation_id },
            { project_slug: "smscode", amount: "10.00", allocation_id: allocated.allocations[1].allocation_id },
          ]),
        ],
      )
    ).rows[0].result,
  );
  assert.deepEqual(
    again.allocations.map((row) => row.allocation_id),
    allocated.allocations.map((row) => row.allocation_id),
  );
  const after = await db.query<{ expenses: string; opex: string }>(
    `select
       (select count(*) from business_os.expenses where source_owner = 'simnetiq')::text as expenses,
       coalesce((select sum(l.gbp_amount) from business_os.financial_lines l
         join business_os.financial_accounts a on a.id = l.account_id
         join business_os.financial_entries e on e.id = l.entry_id
         where a.kind = 'opex' and l.side = 'debit' and e.status = 'posted' and e.kind <> 'reversal'), 0)::text as opex`,
  );
  assert.equal(before.rows[0].expenses, "1");
  assert.equal(after.rows[0].expenses, before.rows[0].expenses);
  assert.equal(await moneyIs(db, after.rows[0].opex, before.rows[0].opex), true);
  assert.equal(await moneyIs(db, after.rows[0].opex, "30"), true);

  const profit = json<Record<string, string | null>>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.project_profit($1::uuid, 'doppler', $2::timestamptz, $3::timestamptz) as result`,
        [ownerId, range[0], range[1]],
      )
    ).rows[0].result,
  );
  assert.equal(await moneyIs(db, profit.profit_before, "100"), true);
  assert.equal(await moneyIs(db, profit.allocation, "12"), true);
  assert.equal(await moneyIs(db, profit.profit_after, "88"), true);
  assert.equal(await moneyIs(db, profit.company_cost, "30"), true);
  assert.equal(await moneyIs(db, profit.net_profit, "88"), true);
  assert.equal(await moneyIs(db, profit.margin, "0.88"), true);

  const hosted = json<{ expense_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.draft_manual_entry($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({
          workflow_kind: "expense",
          vendor: "Host",
          category: "hosting",
          due_on: "2026-06-02",
          service_on: "2026-06-02",
          amount: "25.00",
          currency: "GBP",
          tax_amount: "0.00",
          tax_inclusion: "inclusive",
          receipt_path: "receipts/hosting.pdf",
          receipt_checksum: hash(31),
        }),
      ])
    ).rows[0].result,
  );
  await db.query(`select business_os.update_manual_draft($1::uuid, $2::uuid, $3::jsonb)`, [
    ownerId,
    hosted.expense_id,
    JSON.stringify({ vendor: "Host revised", amount: "25.00", currency: "GBP" }),
  ]);
  const bankBefore = await accountNet(db, "bank-gbp");
  const payableBefore = await accountNet(db, "payable-gbp");
  await db.query(`select business_os.post_manual_entry($1::uuid, $2::uuid)`, [ownerId, hosted.expense_id]);
  assert.equal(await moneyIs(db, await accountNet(db, "bank-gbp"), bankBefore), true);
  const payableDelta = await db.query<{ ok: boolean }>(
    `select $1::numeric - $2::numeric = -25::numeric as ok`,
    [await accountNet(db, "payable-gbp"), payableBefore],
  );
  assert.equal(payableDelta.rows[0].ok, true);
  const revised = await db.query<{ vendor: string }>(
    `select vendor from business_os.expenses where id = $1::uuid`,
    [hosted.expense_id],
  );
  assert.equal(revised.rows[0].vendor, "Host revised");

  const imported = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "project-expense",
      event_kind: "expense",
      record_type: "expense",
      economic_transaction_id: "econ-project-expense",
      counts_as_new_revenue: false,
      content_hash: hash(32),
      original_amount: "9.00",
      debit_account: "opex-gbp",
      credit_account: "payable-gbp",
      vendor: "Imported",
      project_slug: "smscode",
    }),
  );
  assert.equal(imported.status, "posted");
  await assert.rejects(
    () => db.query(`update business_os.expenses set vendor = 'changed' where vendor = 'Imported'`),
    /source_expense_readonly/,
  );
  await db.close();
});

test("missing FX stays pending and non-two-decimal amounts keep their scale", async () => {
  const db = await withLedger();
  const pending = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "usd-missing",
      economic_transaction_id: "econ-usd",
      content_hash: hash(40),
      original_amount: "10.00",
      original_currency: "USD",
    }),
  );
  assert.equal(pending.status, "pending_valuation");
  assert.equal(pending.central_gbp_amount, null);
  const zeros = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_lines where gbp_amount = 0`,
  );
  assert.equal(zeros.rows[0].count, "0");
  const pendingLines = await db.query<{ missing: string }>(
    `select count(*)::text as missing from business_os.financial_lines l
     join business_os.financial_entries e on e.id = l.entry_id
     where e.status = 'pending_valuation' and l.gbp_amount is null`,
  );
  assert.ok(BigInt(pendingLines.rows[0].missing) > 0n);

  const dataset = await db.query<{ id: string }>(
    `select business_os.register_fx_dataset($1::uuid, 'test-gbp-v1', 'manual') as id`,
    [ownerId],
  );
  await db.query(`select business_os.insert_exchange_rate($1::uuid, $2::uuid, 'USD', 'GBP', '0.8', $3::timestamptz)`, [
    ownerId,
    dataset.rows[0].id,
    "2026-01-01T00:00:00.000Z",
  ]);
  const converted = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "usd-converted",
      economic_transaction_id: "econ-usd-2",
      content_hash: hash(41),
      original_amount: "10.00",
      original_currency: "USD",
      source_gbp_amount: "10.00",
      source_policy_version: "source-preview",
      occurred_at: "2026-05-06T12:00:00.000Z",
    }),
  );
  assert.equal(converted.status, "posted");
  assert.equal(await moneyIs(db, converted.central_gbp_amount, "8"), true);
  assert.equal(await moneyIs(db, converted.conversion_difference, "-2"), true);
  const original = await db.query<{ amount: string; currency: string }>(
    `select original_amount::text as amount, original_currency as currency
     from business_os.source_observations where id = $1::uuid`,
    [converted.observation_id],
  );
  assert.equal(await moneyIs(db, original.rows[0].amount, "10"), true);
  assert.equal(original.rows[0].currency, "USD");

  const jpy = await db.query<{ amount: string }>(`select business_os.parse_amount('1500', 'JPY', null, null)::text as amount`);
  assert.equal(await moneyIs(db, jpy.rows[0].amount, "1500"), true);
  await assert.rejects(() => db.query(`select business_os.parse_amount('1500.5', 'JPY', null, null)`), /amount_scale/);
  const kwd = await db.query<{ amount: string }>(`select business_os.parse_amount('1.234', 'KWD', null, null)::text as amount`);
  assert.equal(await moneyIs(db, kwd.rows[0].amount, "1.234"), true);
  await assert.rejects(() => db.query(`select business_os.parse_amount('1.2345', 'KWD', null, null)`), /amount_scale/);
  const btc = await db.query<{ amount: string }>(
    `select business_os.parse_amount('0.123456789012345678', null, 'BTC', 'bitcoin')::text as amount`,
  );
  assert.equal(await moneyIs(db, btc.rows[0].amount, "0.123456789012345678"), true);
  await assert.rejects(
    () => db.query(`select business_os.parse_amount('0.1234567890123456789', null, 'BTC', 'bitcoin')`),
    /amount_invalid/,
  );
  await db.close();
});

test("summaries and SMS legacy do not create revenue, and margin is null at a bad denominator", async () => {
  const db = await withLedger();
  await assert.rejects(
    () =>
      postObservation(
        db,
        ownerId,
        observation({
          external_object_id: "summary-1",
          event_kind: "summary",
          record_type: "summary",
          economic_transaction_id: "econ-summary",
          counts_as_new_revenue: false,
          posting: true,
          content_hash: hash(50),
        }),
      ),
    /summary_non_posting/,
  );
  const summary = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "summary-2",
      event_kind: "summary",
      record_type: "summary",
      economic_transaction_id: "econ-summary-2",
      counts_as_new_revenue: false,
      posting: false,
      content_hash: hash(51),
    }),
  );
  assert.equal(summary.entry_id, null);
  const legacy = await postObservation(
    db,
    ownerId,
    observation({
      project_slug: "smscode",
      external_object_id: "legacy-1",
      event_kind: "legacy",
      record_type: "sale",
      recognition_basis: "sms_legacy",
      economic_transaction_id: "econ-legacy",
      counts_as_new_revenue: true,
      posting: true,
      content_hash: hash(52),
      original_currency: "USD",
      legacy_formula_version: "sms-legacy-usd-v1",
      legacy_net_amount: "8.00",
    }),
  );
  assert.equal(legacy.entry_id, null);
  const legacyRow = await db.query<{ counts: boolean; formula: string }>(
    `select counts_as_new_revenue as counts, legacy_formula_version as formula
     from business_os.source_observations where external_object_id = 'legacy-1'`,
  );
  assert.equal(legacyRow.rows[0].counts, false);
  assert.equal(legacyRow.rows[0].formula, "sms-legacy-usd-v1");

  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-small",
      economic_transaction_id: "econ-small",
      content_hash: hash(53),
      original_amount: "10.00",
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "refund-large",
      event_kind: "refund",
      record_type: "refund",
      economic_transaction_id: "econ-refund",
      counts_as_new_revenue: false,
      content_hash: hash(54),
      original_amount: "25.00",
      debit_account: "revenue-gbp",
      credit_account: "clearing-gbp",
    }),
  );
  const negative = json<Record<string, string | null>>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.project_profit($1::uuid, 'doppler', $2::timestamptz, $3::timestamptz) as result`,
        [ownerId, range[0], range[1]],
      )
    ).rows[0].result,
  );
  assert.equal(negative.margin, null);
  assert.equal(await moneyIs(db, negative.net_sales, "-15"), true);

  const empty = json<Record<string, string | null>>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.project_profit($1::uuid, 'smscode', $2::timestamptz, $3::timestamptz) as result`,
        [ownerId, range[0], range[1]],
      )
    ).rows[0].result,
  );
  assert.equal(empty.margin, null);
  assert.equal(await moneyIs(db, empty.net_sales, "0"), true);

  const unknownTax = json<{ expense_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.draft_manual_entry($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({
          workflow_kind: "expense",
          vendor: "Unknown tax",
          category: "other",
          service_on: "2026-07-01",
          amount: "4.00",
          currency: "GBP",
        }),
      ])
    ).rows[0].result,
  );
  await db.query(`select business_os.post_manual_entry($1::uuid, $2::uuid)`, [ownerId, unknownTax.expense_id]);
  const incomplete = json<Record<string, string | null>>(
    (
      await db.query<{ result: unknown }>(
        `select business_os.project_profit($1::uuid, 'doppler', $2::timestamptz, $3::timestamptz) as result`,
        [ownerId, range[0], range[1]],
      )
    ).rows[0].result,
  );
  assert.equal(incomplete.net_profit, null);
  assert.equal(incomplete.margin, null);
  assert.equal(incomplete.coverage, "partial");
  await db.close();
});

test("a locked London day rejects posting until it is reopened", async () => {
  const db = await withLedger();
  const lock = await db.query<{ id: string }>(
    `select business_os.lock_period($1::uuid, '2026-03-29', '2026-03-29', 'purchase', 'test-v1') as id`,
    [ownerId],
  );
  await assert.rejects(
    () =>
      postObservation(
        db,
        ownerId,
        observation({
          external_object_id: "dst-locked",
          economic_transaction_id: "econ-dst-locked",
          content_hash: hash(60),
          occurred_at: "2026-03-29T22:30:00.000Z",
        }),
      ),
    /period_locked/,
  );
  const nextDay = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "dst-open",
      economic_transaction_id: "econ-dst-open",
      content_hash: hash(61),
      occurred_at: "2026-03-29T23:30:00.000Z",
    }),
  );
  assert.equal(nextDay.status, "posted");
  await db.query(`select business_os.reopen_period($1::uuid, $2::uuid, 'auditor correction')`, [
    ownerId,
    lock.rows[0].id,
  ]);
  const reopened = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "dst-reopened",
      economic_transaction_id: "econ-dst-reopened",
      content_hash: hash(62),
      occurred_at: "2026-03-29T22:30:00.000Z",
    }),
  );
  assert.equal(reopened.status, "posted");
  const audit = await db.query<{ snapshots: string; reason: string | null }>(
    `select
       (select count(*) from business_os.report_snapshots)::text as snapshots,
       (select reopen_reason from business_os.period_locks where id = $1::uuid) as reason`,
    [lock.rows[0].id],
  );
  assert.equal(audit.rows[0].snapshots, "1");
  assert.equal(audit.rows[0].reason, "auditor correction");
  await db.close();
});

test("the finance migration refuses a marketing database", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(`create table public.marketing_contacts (id int);`);
  await assert.rejects(() => db.exec(identitySql), /marketing_contacts/);
  await db.close();

  const clean = new PGlite();
  await assert.rejects(() => clean.exec(financeSql), /identity_foundation_missing/);
  await clean.close();
});
