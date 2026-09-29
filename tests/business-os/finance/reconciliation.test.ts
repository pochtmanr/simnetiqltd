import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { PGlite } from "@electric-sql/pglite";
import { hash, json, moneyIs, observation, ownerId, postObservation, readerId, withLedger } from "@/tests/business-os/finance/ledger";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pullsSql = readFileSync(join(root, "supabase/business-os/migrations/20260929180000_project_pulls.sql"), "utf8");
const reconciliationSql = readFileSync(join(root, "supabase/business-os/migrations/20260929210000_reconciliation.sql"), "utf8");

const from = "2026-06-01T00:00:00.000Z";
const to = "2026-07-01T00:00:00.000Z";

type Metric = { amount: string | null; quality: string; reason?: string };
type Native = { currency: string; metrics: Record<string, Metric>; slices: { source_system: string }[] };
type Report = {
  coverage: string;
  exclusions: { project_slug: string; reason: string; included: boolean }[];
  buckets: {
    partial: boolean;
    native_currency_subtotals: Native[];
    gbp: { reason: string | null; policy_version: string | null; conversion_difference: string | null; metrics: Record<string, Metric> | null };
    allocation: { profit_before?: string; allocation?: string; profit_after?: string; company_cost?: string; unallocated?: string; reason?: string };
    cash: { movements: { kind: string; counts_as_new_revenue: boolean }[]; residuals: { code: string }[]; balances: { additive: boolean }[] };
    legacy_bridge: {
      cash_net_is_bank_cash: boolean;
      preserved: { gross: string; apple_fee: string; refunds: string; cash_net: string } | null;
      real_spend: null;
      real_spend_reason: string;
      warnings: string[];
    } | null;
  }[];
};

async function withBooks() {
  const db = await withLedger();
  await db.exec(pullsSql);
  await db.exec(reconciliationSql);
  return db;
}

async function report(db: PGlite, payload: Record<string, unknown>, actor = ownerId) {
  const rows = await db.query<{ result: unknown }>(
    `select business_os.financial_report($1::uuid, $2::jsonb) as result`,
    [actor, JSON.stringify(payload)],
  );
  return json<Report>(rows.rows[0].result);
}

function native(body: Report, currency: string) {
  return body.buckets[0].native_currency_subtotals.find((row) => row.currency === currency);
}

async function connect(db: PGlite, slug: string) {
  const rows = await db.query<{ id: string }>(
    `insert into business_os.source_connections (
       organization_id, project_id, environment, source_environment, base_url, key_id, secret_reference
     )
     select organization_id, id, 'local', 'test', 'https://source.example', 'key-1', 'BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION'
     from business_os.projects where slug = $1
     returning id`,
    [slug],
  );
  return rows.rows[0].id;
}

async function snapshot(
  db: PGlite,
  connectionId: string,
  dataset: string,
  snapshotId: string,
  body: Record<string, unknown>,
) {
  await db.query(
    `insert into business_os.imported_snapshots (
       organization_id, connection_id, dataset, snapshot_id, body, coverage, cutoff_from, cutoff_to, status
     )
     select organization_id, $1::uuid, $2, $3, $4::jsonb, 'partial', $5::timestamptz, $6::timestamptz, 'current'
     from business_os.source_connections where id = $1::uuid`,
    [connectionId, dataset, snapshotId, JSON.stringify(body), from, to],
  );
}

test("primary fee components and source dimensions are stored once", async () => {
  const db = await withBooks();
  await postObservation(
    db,
    ownerId,
    observation({
      original_currency: "USD",
      source_system: "revenuecat",
      channel: "ios",
      store: "app_store",
      processor: "apple",
      components: [
        {
          component_id: "cmp-fee-1",
          component_type: "store_commission",
          posting_role: "primary",
          amount: { amount: "15.00", currency: "USD", quality: "estimated", reason: "legacy_gross_minus_net" },
        },
      ],
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      record_type: "fee",
      event_kind: "fee",
      posting: false,
      posting_role: "alias",
      counts_as_new_revenue: false,
      component_id: "cmp-fee-1",
      external_object_id: "fee-alias",
      economic_transaction_id: "econ-fee",
      content_hash: hash(2),
      original_amount: "15.00",
      original_currency: "USD",
    }),
  );
  const components = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.observation_components where posting_role = 'primary'`,
  );
  assert.equal(components.rows[0].count, "1");
  const dimensions = await db.query<{ source_system: string; channel: string; store: string; processor: string }>(
    `select source_system, channel, store, processor
     from business_os.source_observations where record_type = 'sale'`,
  );
  assert.deepEqual(dimensions.rows[0], {
    source_system: "revenuecat",
    channel: "ios",
    store: "app_store",
    processor: "apple",
  });
  await db.close();
});

test("native gross and refunds stay apart from missing tax, fees, and costs", async () => {
  const db = await withBooks();
  await postObservation(db, ownerId, observation({ original_amount: "100.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  await postObservation(
    db,
    ownerId,
    observation({
      record_type: "refund",
      event_kind: "refund",
      counts_as_new_revenue: false,
      external_object_id: "refund-1",
      economic_transaction_id: "econ-refund",
      content_hash: hash(3),
      original_amount: "10.00",
      debit_account: "revenue-gbp",
      credit_account: "clearing-gbp",
      occurred_at: "2026-06-16T12:00:00.000Z",
    }),
  );
  const body = await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  const gbp = native(body, "GBP");
  assert.equal(await moneyIs(db, gbp?.metrics.gross_customer_sales.amount ?? null, "100"), true);
  assert.equal(await moneyIs(db, gbp?.metrics.refunded_principal.amount ?? null, "10"), true);
  assert.equal(gbp?.metrics.sales_tax.amount, null);
  assert.equal(gbp?.metrics.sales_tax.reason, "missing_sales_tax");
  assert.equal(gbp?.metrics.store_and_processor_fees.amount, null);
  assert.equal(gbp?.metrics.store_and_processor_fees.reason, "missing_fee_components");
  assert.equal(gbp?.metrics.direct_costs.amount, null);
  assert.equal(gbp?.metrics.net_sales.amount, null);
  assert.equal(gbp?.metrics.net_profit.amount, null);
  assert.equal(gbp?.metrics.net_profit.reason, "incomplete_other_income_financing_or_tax");
  await db.close();
});

test("a complete native stack still withholds net profit", async () => {
  const db = await withBooks();
  await postObservation(
    db,
    ownerId,
    observation({
      original_amount: "100.00",
      occurred_at: "2026-06-15T12:00:00.000Z",
      source_system: "revenuecat",
      channel: "ios",
      store: "app_store",
      processor: "apple",
      components: [
        {
          component_id: "tax-1",
          component_type: "sales_tax",
          posting_role: "primary",
          amount: { amount: "5.00", currency: "GBP", quality: "actual" },
        },
        {
          component_id: "fee-1",
          component_type: "store_commission",
          posting_role: "primary",
          amount: { amount: "15.00", currency: "GBP", quality: "actual" },
        },
      ],
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      record_type: "refund",
      event_kind: "refund",
      counts_as_new_revenue: false,
      external_object_id: "refund-1",
      economic_transaction_id: "econ-refund",
      content_hash: hash(4),
      original_amount: "10.00",
      debit_account: "revenue-gbp",
      credit_account: "clearing-gbp",
      occurred_at: "2026-06-16T12:00:00.000Z",
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      record_type: "direct_cost",
      event_kind: "direct_cost",
      counts_as_new_revenue: false,
      external_object_id: "cost-1",
      economic_transaction_id: "econ-cost",
      content_hash: hash(5),
      original_amount: "20.00",
      debit_account: "cogs-gbp",
      credit_account: "clearing-gbp",
      occurred_at: "2026-06-17T12:00:00.000Z",
    }),
  );
  const gbp = native(await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" }), "GBP");
  assert.equal(await moneyIs(db, gbp?.metrics.net_sales.amount ?? null, "85"), true);
  assert.equal(await moneyIs(db, gbp?.metrics.net_proceeds.amount ?? null, "70"), true);
  assert.equal(await moneyIs(db, gbp?.metrics.contribution_profit.amount ?? null, "50"), true);
  assert.equal(await moneyIs(db, gbp?.metrics.operating_expenses.amount ?? null, "0"), true);
  assert.equal(await moneyIs(db, gbp?.metrics.operating_profit.amount ?? null, "50"), true);
  assert.equal(gbp?.metrics.net_profit.amount, null);
  assert.equal(gbp?.margin, "0.5882");
  await db.close();
});

test("an estimated fee is not doubled by its alias and does not become proceeds", async () => {
  const db = await withBooks();
  await postObservation(
    db,
    ownerId,
    observation({
      original_currency: "USD",
      original_amount: "100.00",
      occurred_at: "2026-06-15T12:00:00.000Z",
      components: [
        {
          component_id: "cmp-fee-1",
          component_type: "store_commission",
          posting_role: "primary",
          amount: { amount: "15.00", currency: "USD", quality: "estimated", reason: "legacy_gross_minus_net" },
        },
      ],
    }),
  );
  await postObservation(
    db,
    ownerId,
    observation({
      record_type: "fee",
      event_kind: "fee",
      posting: false,
      posting_role: "alias",
      counts_as_new_revenue: false,
      component_id: "cmp-fee-1",
      external_object_id: "fee-alias",
      economic_transaction_id: "econ-fee",
      content_hash: hash(6),
      original_amount: "15.00",
      original_currency: "USD",
      occurred_at: "2026-06-15T12:00:00.000Z",
    }),
  );
  const usd = native(await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" }), "USD");
  assert.equal(await moneyIs(db, usd?.metrics.store_and_processor_fees.amount ?? null, "15"), true);
  assert.equal(usd?.metrics.store_and_processor_fees.quality, "estimated");
  assert.equal(usd?.metrics.net_proceeds.amount, null);
  await db.close();
});

test("top-ups and settlements stay out of gross and unmatched payouts remain residuals", async () => {
  const db = await withBooks();
  await postObservation(db, ownerId, observation({ original_amount: "10.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  await db.query(`select business_os.post_movement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      kind: "top_up",
      recognition_basis: "purchase",
      amount: "50.00",
      currency: "GBP",
      debit_account: "prepaid-gbp",
      credit_account: "bank-gbp",
      effective_at: "2026-06-16T12:00:00.000Z",
      external_id: "topup-1",
      project_slug: "doppler",
    }),
  ]);
  await db.query(`select business_os.record_settlement($1::uuid, $2::jsonb)`, [
    ownerId,
    JSON.stringify({
      project_slug: "doppler",
      external_payout_id: "payout-1",
      amount: "80.00",
      currency: "GBP",
      settled_at: "2026-06-18T12:00:00.000Z",
    }),
  ]);
  const body = await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  assert.equal(await moneyIs(db, native(body, "GBP")?.metrics.gross_customer_sales.amount ?? null, "10"), true);
  assert.equal(body.buckets[0].cash.movements.some((row) => row.kind === "top_up" && row.counts_as_new_revenue === false), true);
  assert.equal(body.buckets[0].cash.residuals.some((row) => row.code === "unmatched_settlement"), true);
  assert.equal(body.buckets[0].cash.balances.every((row) => row.additive === false), true);
  await db.close();
});

test("a voided sale is replaced once", async () => {
  const db = await withBooks();
  const posted = await postObservation(
    db,
    ownerId,
    observation({
      external_object_id: "sale-void",
      economic_transaction_id: "eco-void",
      original_amount: "100.00",
      occurred_at: "2026-06-15T12:00:00.000Z",
      content_hash: hash(7),
    }),
  );
  await db.query(`select business_os.replace_source_observation($1::uuid, $2::uuid, $3::jsonb)`, [
    ownerId,
    posted.observation_id,
    JSON.stringify(
      observation({
        external_object_id: "sale-void",
        economic_transaction_id: "eco-void",
        revision: 2,
        original_amount: "40.00",
        occurred_at: "2026-06-15T12:00:00.000Z",
        content_hash: hash(8),
      }),
    ),
  ]);
  const gbp = native(await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" }), "GBP");
  assert.equal(await moneyIs(db, gbp?.metrics.gross_customer_sales.amount ?? null, "40"), true);
  await db.close();
});

test("shared overhead is shown before and after one allocation", async () => {
  const db = await withBooks();
  await postObservation(
    db,
    ownerId,
    observation({
      original_amount: "100.00",
      economic_transaction_id: "econ-profit",
      content_hash: hash(9),
      occurred_at: "2026-06-15T12:00:00.000Z",
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
          service_on: "2026-06-10",
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
  await db.query(`select business_os.allocate_shared_expense($1::uuid, $2::uuid, $3::jsonb)`, [
    ownerId,
    drafted.expense_id,
    JSON.stringify([
      { project_slug: "doppler", amount: "12.00" },
      { project_slug: "smscode", amount: "10.00" },
    ]),
  ]);
  const body = await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  assert.equal(await moneyIs(db, body.buckets[0].allocation.profit_before ?? null, "100"), true);
  assert.equal(await moneyIs(db, body.buckets[0].allocation.allocation ?? null, "12"), true);
  assert.equal(await moneyIs(db, body.buckets[0].allocation.profit_after ?? null, "88"), true);
  assert.equal(await moneyIs(db, body.buckets[0].allocation.company_cost ?? null, "30"), true);
  assert.equal(await moneyIs(db, body.buckets[0].allocation.unallocated ?? null, "8"), true);
  await db.close();
});

test("company purchase totals name SMS legacy instead of adding it", async () => {
  const db = await withBooks();
  await postObservation(db, ownerId, observation({ original_amount: "10.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  await postObservation(
    db,
    ownerId,
    observation({
      project_slug: "smscode",
      recognition_basis: "sms_legacy",
      legacy_formula_version: "sms-legacy-usd-v1",
      legacy_net_amount: "77.00",
      original_amount: "100.00",
      original_currency: "USD",
      external_object_id: "sms-sale",
      economic_transaction_id: "econ-sms",
      content_hash: hash(10),
      occurred_at: "2026-06-15T12:00:00.000Z",
    }),
  );
  const body = await report(db, { from, to, basis: "purchase", grain: "custom" });
  assert.equal(await moneyIs(db, native(body, "GBP")?.metrics.gross_customer_sales.amount ?? null, "10"), true);
  assert.equal(native(body, "USD"), undefined);
  assert.equal(body.exclusions.some((row) => row.project_slug === "smscode" && row.reason === "other_basis_present" && row.included === false), true);
  assert.equal(body.coverage, "partial");
  await db.close();
});

test("SMS legacy USD is preserved from the source snapshot and is not bank cash", async () => {
  const db = await withBooks();
  await postObservation(
    db,
    ownerId,
    observation({
      project_slug: "smscode",
      recognition_basis: "sms_legacy",
      legacy_formula_version: "sms-legacy-usd-v1",
      legacy_net_amount: "77.00",
      original_amount: "100.00",
      original_currency: "USD",
      external_object_id: "sms-sale",
      economic_transaction_id: "econ-sms",
      content_hash: hash(11),
      occurred_at: "2026-06-15T12:00:00.000Z",
    }),
  );
  const connectionId = await connect(db, "smscode");
  await snapshot(db, connectionId, "finance/reconciliation", "snap-recon-01", {
    runs: [
      {
        legacy_comparison: {
          formula_version: "sms-legacy-usd-v1",
          currency: "USD",
          cutoff: to,
          cash_net_is_bank_cash: false,
          fields: {
            gross: { amount: "100.00" },
            apple_fee: { amount: "15.00" },
            refunds: { amount: "8.00" },
            cash_net: { amount: "77.00" },
          },
        },
      },
    ],
  });
  const body = await report(db, { project_slug: "smscode", from, to, basis: "sms_legacy", grain: "custom" });
  const bridge = body.buckets[0].legacy_bridge;
  assert.equal(bridge?.cash_net_is_bank_cash, false);
  assert.equal(bridge?.preserved?.cash_net, "77.00");
  assert.equal(bridge?.preserved?.apple_fee, "15.00");
  assert.equal(bridge?.real_spend, null);
  assert.equal(bridge?.real_spend_reason, "missing_balance_evidence");
  assert.ok(bridge?.warnings.includes("cash_net_is_proceeds_not_bank"));
  assert.ok(bridge?.warnings.includes("earned_vs_purchase"));
  assert.ok(bridge?.warnings.includes("recorded_cost_vs_real_spend"));
  assert.equal(native(body, "USD")?.metrics.gross_customer_sales.amount, null);
  await db.close();
});

test("GBP is withheld when central policies differ and matches when the source policy agrees", async () => {
  const mixed = await withBooks();
  await postObservation(mixed, ownerId, observation({ original_amount: "10.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  const dataset = await mixed.query<{ id: string }>(
    `select business_os.register_fx_dataset($1::uuid, 'test-gbp-v1', 'manual') as id`,
    [ownerId],
  );
  await mixed.query(`select business_os.insert_exchange_rate($1::uuid, $2::uuid, 'USD', 'GBP', '0.8', $3::timestamptz)`, [
    ownerId,
    dataset.rows[0].id,
    "2026-01-01T00:00:00.000Z",
  ]);
  await postObservation(
    mixed,
    ownerId,
    observation({
      external_object_id: "usd-sale",
      economic_transaction_id: "econ-usd",
      content_hash: hash(12),
      original_amount: "10.00",
      original_currency: "USD",
      occurred_at: "2026-06-16T12:00:00.000Z",
    }),
  );
  const mixedReport = await report(mixed, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  assert.equal(mixedReport.buckets[0].gbp.reason, "fx_policy_mismatch");
  assert.equal(mixedReport.buckets[0].gbp.metrics, null);
  assert.equal(native(mixedReport, "USD")?.metrics.gross_customer_sales.amount, "10");
  await mixed.close();

  const matched = await withBooks();
  const matchedDataset = await matched.query<{ id: string }>(
    `select business_os.register_fx_dataset($1::uuid, 'test-gbp-v1', 'manual') as id`,
    [ownerId],
  );
  await matched.query(`select business_os.insert_exchange_rate($1::uuid, $2::uuid, 'USD', 'GBP', '0.8', $3::timestamptz)`, [
    ownerId,
    matchedDataset.rows[0].id,
    "2026-01-01T00:00:00.000Z",
  ]);
  await postObservation(
    matched,
    ownerId,
    observation({
      original_amount: "10.00",
      original_currency: "USD",
      source_gbp_amount: "8.00",
      source_policy_version: "test-gbp-v1",
      occurred_at: "2026-06-16T12:00:00.000Z",
    }),
  );
  const matchedReport = await report(matched, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  assert.equal(matchedReport.buckets[0].gbp.reason, null);
  assert.equal(await moneyIs(matched, matchedReport.buckets[0].gbp.metrics?.gross_customer_sales.amount ?? null, "8"), true);
  assert.equal(await moneyIs(matched, matchedReport.buckets[0].gbp.conversion_difference, "0"), true);
  await matched.close();
});

test("clipped London months and oversized or mixed windows are rejected or flagged", async () => {
  const db = await withBooks();
  const month = await report(db, {
    project_slug: "doppler",
    from: "2026-09-10T00:00:00.000Z",
    to: "2026-09-20T00:00:00.000Z",
    basis: "purchase",
    grain: "month",
  });
  assert.equal(month.buckets[0].partial, true);
  const year = await report(db, {
    project_slug: "doppler",
    from,
    to,
    basis: "purchase",
    grain: "year",
  });
  assert.equal(year.buckets[0].partial, true);
  await assert.rejects(
    () => report(db, { project_slug: "doppler", from: "2024-01-01T00:00:00.000Z", to: "2026-01-01T00:00:00.000Z", basis: "purchase", grain: "custom" }),
    /interval_too_large/,
  );
  await assert.rejects(
    () => report(db, { project_slug: "doppler", from, to, basis: "purchase,sms_legacy", grain: "custom" }),
    /basis_invalid/,
  );
  await db.close();
});

test("synthetic native parity matches without verifying, and a penny is a mismatch", async () => {
  const db = await withBooks();
  await postObservation(db, ownerId, observation({ original_amount: "10.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  const body = await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" });
  const connectionId = await connect(db, "doppler");
  await snapshot(db, connectionId, "finance/summary", "snap-summary-01", {
    basis: "purchase",
    formula_version: "test-v1",
    fx_policy_version: body.buckets[0].gbp.policy_version,
    native_currency_subtotals: body.buckets[0].native_currency_subtotals,
  });
  const matched = json<{ run_id: string; status: string; residuals: { code: string }[] }>(
    (
      await db.query<{ result: unknown }>(`select business_os.compare_shadow($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({ project_slug: "doppler", from, to, basis: "purchase", evidence_kind: "synthetic" }),
      ])
    ).rows[0].result,
  );
  assert.equal(matched.status, "match");
  assert.equal(matched.residuals.some((row) => row.code === "source_admin_not_provided"), true);
  const gate = await db.query<{ state: string }>(
    `select state from business_os.dataset_verifications where dataset = 'finance/summary' and basis = 'purchase'
     and project_id = (select id from business_os.projects where slug = 'doppler')`,
  );
  assert.equal(gate.rows[0].state, "unverified");
  await assert.rejects(
    () => db.query(`select business_os.activate_dataset_gate($1::uuid, $2::uuid)`, [ownerId, matched.run_id]),
    /synthetic_evidence/,
  );
  const project = await db.query<{ state: string; reporting_enabled: boolean }>(
    `select state, reporting_enabled from business_os.projects where slug = 'doppler'`,
  );
  assert.equal(project.rows[0].state, "unverified");
  assert.equal(project.rows[0].reporting_enabled, false);

  const mismatchedNative = structuredClone(body.buckets[0].native_currency_subtotals);
  mismatchedNative[0].metrics.gross_customer_sales.amount = "10.01";
  await db.query(
    `update business_os.imported_snapshots set body = $1::jsonb where snapshot_id = 'snap-summary-01'`,
    [JSON.stringify({
      basis: "purchase",
      formula_version: "test-v1",
      fx_policy_version: body.buckets[0].gbp.policy_version,
      native_currency_subtotals: mismatchedNative,
    })],
  );
  const mismatched = json<{ status: string; residuals: { code: string; reason: string | null }[] }>(
    (
      await db.query<{ result: unknown }>(`select business_os.compare_shadow($1::uuid, $2::jsonb) as result`, [
        ownerId,
        JSON.stringify({ project_slug: "doppler", from, to, basis: "purchase", evidence_kind: "synthetic" }),
      ])
    ).rows[0].result,
  );
  assert.equal(mismatched.status, "mismatch");
  assert.equal(mismatched.residuals.some((row) => row.code === "native_mismatch" && row.reason === "gross_customer_sales"), true);
  const quality = json<{ residuals: { code: string }[]; gates: { state: string }[] }>(
    (
      await db.query<{ result: unknown }>(`select business_os.reconciliation_quality($1::uuid, 'doppler') as result`, [ownerId])
    ).rows[0].result,
  );
  assert.equal(quality.residuals.some((row) => row.code === "native_mismatch"), true);
  assert.equal(quality.gates.every((row) => row.state === "unverified"), true);
  await db.close();
});

test("a reader can report and cannot activate a gate", async () => {
  const db = await withBooks();
  await postObservation(db, ownerId, observation({ original_amount: "10.00", occurred_at: "2026-06-15T12:00:00.000Z" }));
  const body = await report(db, { project_slug: "doppler", from, to, basis: "purchase", grain: "custom" }, readerId);
  assert.equal(await moneyIs(db, native(body, "GBP")?.metrics.gross_customer_sales.amount ?? null, "10"), true);
  const drill = json<{ records: { formula_version: string; observation_id: string }[]; snapshot_id: string }>(
    (
      await db.query<{ result: unknown }>(`select business_os.report_drill($1::uuid, $2::jsonb) as result`, [
        readerId,
        JSON.stringify({ project_slug: "doppler", from, to, basis: "purchase", metric: "gross_customer_sales" }),
      ])
    ).rows[0].result,
  );
  assert.equal(drill.records.length, 1);
  assert.equal(drill.records[0].formula_version, "test-v1");
  assert.equal(drill.snapshot_id, "central-unverified");
  await assert.rejects(
    () => db.query(`select business_os.activate_dataset_gate($1::uuid, $2::uuid)`, [readerId, "44444444-4444-4444-8444-444444444444"]),
    /reader_forbidden/,
  );
  await db.close();
});
