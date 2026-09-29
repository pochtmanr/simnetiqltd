import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import recordsFixture from "@/contracts/business-os/v1/fixtures/positive/finance-records-sale-refund-reversal.json";
import overviewFixture from "@/contracts/business-os/v1/fixtures/positive/overview-partial-coverage.json";
import analyticsFixture from "@/contracts/business-os/v1/fixtures/positive/analytics-ga4-daily-page.json";
import { hash, json, ownerId, readerId, withLedger } from "@/tests/business-os/finance/ledger";
import type { SyncStore } from "@/lib/business-os/sync/worker";
import { runSyncTick } from "@/lib/business-os/sync/worker";

const pullsSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../supabase/business-os/migrations/20260929180000_project_pulls.sql"),
  "utf8",
);
const reconciliationSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../supabase/business-os/migrations/20260929210000_reconciliation.sql"),
  "utf8",
);

const capabilities = {
  contract_version: "business-os.contract.v1",
  project_id: "doppler",
  environment: "production",
  formula_versions: ["unconfigured"],
  fx_policy_version: "gbp-unconfigured",
  timezone: "Europe/London",
};

async function withSync() {
  const db = await withLedger();
  await db.exec(pullsSql);
  await db.exec(reconciliationSql);
  return db;
}

async function enable(db: PGlite, slug: string, datasets: string[], environment = "production") {
  const registered = await db.query<{ id: string }>(
    `select business_os.register_source_connection(
      $1::uuid,
      (select id from business_os.projects where slug = $2),
      $3,
      'https://source.example',
      'source-key-1',
      'BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION'
    ) as id`,
    [ownerId, slug, environment],
  );
  const id = registered.rows[0].id;
  const body = { ...capabilities, project_id: slug, environment };
  const datasetSql = datasets.map((dataset) => `'${dataset.replaceAll("'", "")}'`).join(", ");
  await db.query(
    `select business_os.enable_source_connection(
      $1::uuid, $2::uuid, $3::jsonb, array[${datasetSql}]::text[], 'purchase', 100,
      '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'
    )`,
    [ownerId, id, JSON.stringify(body)],
  );
  return id;
}

function store(db: PGlite): SyncStore {
  return {
    async claim(workerId) {
      const rows = await db.query<{ result: unknown }>(
        `select business_os.claim_sync_lease($1, 60) as result`,
        [workerId],
      );
      return json(rows.rows[0]?.result);
    },
    async commitRecords(connectionId, workerId, page) {
      const rows = await db.query<{ result: unknown }>(
        `select business_os.commit_records_page($1::uuid, $2, $3::jsonb) as result`,
        [connectionId, workerId, JSON.stringify(page)],
      );
      return json(rows.rows[0]?.result);
    },
    async commitSnapshot(connectionId, workerId, page) {
      const rows = await db.query<{ result: unknown }>(
        `select business_os.commit_snapshot_page($1::uuid, $2, $3::jsonb) as result`,
        [connectionId, workerId, JSON.stringify(page)],
      );
      return json(rows.rows[0]?.result);
    },
    async resync(connectionId, workerId, endpoint) {
      const rows = await db.query<{ result: unknown }>(
        `select business_os.begin_resync($1::uuid, $2, $3) as result`,
        [connectionId, workerId, endpoint],
      );
      return json(rows.rows[0]?.result);
    },
    async fail(connectionId, workerId, endpoint, errorCode, retrySeconds, markStale) {
      await db.query(
        `select business_os.record_sync_failure($1::uuid, $2, $3, $4, $5, $6, $7)`,
        [connectionId, workerId, endpoint, errorCode, errorCode, retrySeconds, markStale],
      );
    },
  };
}

function sale(overrides: Record<string, unknown> = {}) {
  return {
    project_slug: "doppler",
    environment: "production",
    external_object_id: "invoice-1",
    event_kind: "sale",
    external_adjustment_id: "",
    revision: 1,
    record_type: "sale",
    recognition_basis: "purchase",
    posting: true,
    posting_role: "primary",
    economic_transaction_id: "econ-1",
    counts_as_new_revenue: true,
    original_amount: "10.00",
    original_currency: "GBP",
    quality: "actual",
    occurred_at: "2026-05-01T12:00:00Z",
    formula_version: "unconfigured",
    content_hash: hash(1),
    status: "posted",
    record_id: "sale-1",
    change_sequence: "10",
    debit_account: "clearing-gbp",
    credit_account: "revenue-gbp",
    ...overrides,
  };
}

function recordsPage(records: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    endpoint: "finance/records",
    snapshot_id: "snap-1",
    high_watermark: "100",
    query_binding_sha256: hash(9),
    data_as_of: "2026-05-02T00:00:00Z",
    has_more: false,
    next_cursor: null,
    checkpoint: "ckpt-1",
    records,
    quarantine: [],
    ...overrides,
  };
}

async function claim(db: PGlite, workerId: string) {
  const rows = await db.query<{ result: unknown }>(
    `select business_os.claim_sync_lease($1, 60) as result`,
    [workerId],
  );
  return json<{ connection_id: string; endpoint: string; cursor: string | null; initial_from: string } | null>(
    rows.rows[0]?.result,
  );
}

async function commit(db: PGlite, connectionId: string, workerId: string, page: unknown) {
  const rows = await db.query<{ result: unknown }>(
    `select business_os.commit_records_page($1::uuid, $2, $3::jsonb) as result`,
    [connectionId, workerId, JSON.stringify(page)],
  );
  return json<{ committed: boolean; quarantined?: number }>(rows.rows[0]?.result);
}

async function cursorOf(db: PGlite, connectionId: string) {
  const rows = await db.query<{ cursor: string | null; checkpoint: string | null; initial_from: string; phase: string }>(
    `select cursor, checkpoint, initial_from::text, phase
     from business_os.sync_cursors where connection_id = $1`,
    [connectionId],
  );
  return rows.rows[0];
}

async function observationCount(db: PGlite) {
  const rows = await db.query<{ count: string }>(`select count(*)::text as count from business_os.source_observations`);
  return Number(rows.rows[0].count);
}

test("the pulls migration refuses the marketing database", async () => {
  const db = new PGlite();
  await db.exec(`create table public.marketing_contacts (id int);`);
  await assert.rejects(() => db.exec(pullsSql), /marketing_contacts/);
});

test("a second worker cannot claim a leased connection, and an expired lease resumes the same cursor", async () => {
  const db = await withSync();
  const doppler = await enable(db, "doppler", ["finance/records"]);
  const sms = await enable(db, "smscode", ["finance/records"]);
  const first = await claim(db, "worker-one");
  const second = await claim(db, "worker-two");
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first?.connection_id, second?.connection_id);
  assert.equal(await claim(db, "worker-rest"), null);
  await db.query(
    `update business_os.source_connections set lease_until = clock_timestamp() - interval '1 second' where id = $1`,
    [first?.connection_id],
  );
  const resumed = await claim(db, "worker-next");
  assert.equal(resumed?.connection_id, first?.connection_id);
  assert.equal((await cursorOf(db, first?.connection_id ?? doppler)).cursor, null);
  assert.ok(sms);
});

test("a failed page does not advance the cursor or keep partial facts", async () => {
  const db = await withSync();
  const id = await enable(db, "doppler", ["finance/records"]);
  const leased = await claim(db, "worker-one");
  assert.equal(leased?.connection_id, id);
  await assert.rejects(
    () => commit(db, id, "worker-one", recordsPage([sale(), sale({
      record_id: "sale-2",
      external_object_id: "invoice-2",
      economic_transaction_id: "econ-2",
      content_hash: hash(2),
      change_sequence: "11",
      original_amount: "1.2.3",
    })])),
    /amount_invalid/,
  );
  assert.equal(await observationCount(db), 0);
  assert.equal((await cursorOf(db, id)).cursor, null);
  assert.equal((await cursorOf(db, id)).checkpoint, null);
});

test("duplicate replay, a void revision, a hash conflict, and a foreign project do not double-post", async () => {
  const db = await withSync();
  const id = await enable(db, "doppler", ["finance/records"]);
  await claim(db, "worker-one");
  const page = recordsPage([
    sale(),
    sale({
      revision: 2,
      status: "void",
      supersedes_revision: 1,
      change_sequence: "11",
      content_hash: hash(2),
      posting: false,
    }),
  ]);
  assert.equal((await commit(db, id, "worker-one", page)).committed, true);
  assert.equal(await observationCount(db), 2);
  const statuses = await db.query<{ revision: number; status: string }>(
    `select revision, status from business_os.source_observations order by revision`,
  );
  assert.deepEqual(statuses.rows, [
    { revision: 1, status: "void" },
    { revision: 2, status: "void" },
  ]);
  const openRevenue = await db.query<{ count: string }>(
    `select count(*)::text as count from business_os.financial_entries
     where status = 'posted' and reversal_of is null`,
  );
  assert.equal(Number(openRevenue.rows[0].count), 0);

  await claim(db, "worker-two");
  assert.equal((await commit(db, id, "worker-two", page)).committed, true);
  assert.equal(await observationCount(db), 2);

  await claim(db, "worker-hash");
  const conflict = await commit(db, id, "worker-hash", recordsPage([
    sale({ content_hash: hash(3) }),
  ]));
  assert.equal(conflict.committed, false);
  assert.equal(conflict.quarantined, 1);
  const hashRow = await db.query<{ content_hash: string }>(
    `select content_hash from business_os.source_observations where revision = 1`,
  );
  assert.equal(hashRow.rows[0].content_hash, hash(1));
  assert.equal((await cursorOf(db, id)).checkpoint, "ckpt-1");

  await db.exec(`update business_os.source_connections set next_attempt_at = null where id = '${id}'`);
  await claim(db, "worker-bind");
  const bound = await commit(db, id, "worker-bind", recordsPage([
    sale({ project_slug: "smscode", record_id: "other-1", external_object_id: "other-1", economic_transaction_id: "econ-9", content_hash: hash(4) }),
  ]));
  assert.equal(bound.committed, false);
  const reasons = await db.query<{ reason: string; detail: string }>(
    `select reason, detail from business_os.import_quarantine order by created_at`,
  );
  assert.equal(reasons.rows.some((row) => row.reason === "hash_conflict"), true);
  assert.equal(reasons.rows.some((row) => row.detail === "project_mismatch"), true);
});

test("a 410 resync drops the cursor, keeps the original range, and dedups the overlap", async () => {
  const db = await withSync();
  const id = await enable(db, "doppler", ["finance/records"]);
  await claim(db, "worker-one");
  await commit(db, id, "worker-one", recordsPage([sale()]));
  await claim(db, "worker-two");
  const resync = await db.query<{ result: unknown }>(
    `select business_os.begin_resync($1::uuid, 'worker-two', 'finance/records') as result`,
    [id],
  );
  const body = json<{ initial_from: string; initial_to: string }>(resync.rows[0].result);
  assert.equal(body.initial_from, "2026-01-01T00:00:00Z");
  assert.equal(body.initial_to, "2026-02-01T00:00:00Z");
  assert.equal((await cursorOf(db, id)).cursor, null);
  assert.equal((await cursorOf(db, id)).phase, "backfill");
  await claim(db, "worker-next");
  await commit(db, id, "worker-next", recordsPage([sale()]));
  assert.equal(await observationCount(db), 1);
});

test("source outage keeps the last snapshot and marks it stale, and analytics do not post", async () => {
  const db = await withSync();
  const id = await enable(db, "doppler", ["overview", "analytics/ga4_overview_daily"]);
  const overviewClaim = await claim(db, "worker-one");
  assert.equal(overviewClaim?.endpoint, "analytics/ga4_overview_daily");
  await db.query(
    `select business_os.commit_snapshot_page($1::uuid, 'worker-one', $2::jsonb)`,
    [id, JSON.stringify({
      endpoint: "analytics/ga4_overview_daily",
      has_more: false,
      next_cursor: null,
      grain: "ga4_overview_daily",
      timezone: "Europe/London",
      coverage: "partial",
      body: analyticsFixture,
    })],
  );
  const entries = await db.query<{ count: string }>(`select count(*)::text as count from business_os.financial_entries`);
  assert.equal(Number(entries.rows[0].count), 0);

  const next = await claim(db, "worker-two");
  assert.equal(next?.endpoint, "overview");
  await db.query(
    `select business_os.commit_snapshot_page($1::uuid, 'worker-two', $2::jsonb)`,
    [id, JSON.stringify({
      endpoint: "overview",
      has_more: false,
      next_cursor: null,
      grain: "period",
      timezone: "Europe/London",
      coverage: "partial",
      cutoff_from: "2026-09-26T23:00:00Z",
      cutoff_to: "2026-09-27T23:00:00Z",
      body: overviewFixture,
    })],
  );
  await claim(db, "worker-out");
  await db.query(
    `select business_os.record_sync_failure($1::uuid, 'worker-out', 'overview', 'source_unavailable', 'source_unavailable', 60, true)`,
    [id],
  );
  const snapshots = await db.query<{ dataset: string; status: string }>(
    `select dataset, status from business_os.imported_snapshots order by dataset`,
  );
  assert.deepEqual(snapshots.rows, [
    { dataset: "analytics/ga4_overview_daily", status: "current" },
    { dataset: "overview", status: "stale" },
  ]);
});

test("a timeout after the response is received does not advance the cursor, and the replay posts once", async () => {
  const db = await withSync();
  await enable(db, "doppler", ["finance/records"]);
  const sync = store(db);
  let commits = 0;
  const pulling = async () => ({ kind: "ok" as const, body: recordsFixture, paths: ["/api/business-os/v1/finance/records"] });
  const flaky: SyncStore = {
    ...sync,
    async commitRecords(connectionId, workerId, page) {
      commits += 1;
      if (commits === 1) throw new Error("timeout");
      return sync.commitRecords(connectionId, workerId, page);
    },
  };
  const first = await runSyncTick(flaky, {
    workerId: "worker-one",
    secretFor: () => "test-secret",
    pull: pulling,
  });
  assert.equal(first.claimed && first.outcome, "commit_failed");
  assert.equal(await observationCount(db), 0);
  await db.exec(`update business_os.source_connections set next_attempt_at = clock_timestamp() - interval '1 second'`);
  const second = await runSyncTick(sync, {
    workerId: "worker-two",
    secretFor: () => "test-secret",
    pull: pulling,
  });
  assert.equal(second.claimed && second.outcome, "committed");
  assert.equal(await observationCount(db), recordsFixture.records.length);
  const third = await runSyncTick(sync, {
    workerId: "worker-rest",
    secretFor: () => "test-secret",
    pull: pulling,
  });
  assert.equal(third.claimed && third.outcome, "committed");
  assert.equal(await observationCount(db), recordsFixture.records.length);
});

test("read-only members can inspect sync rows and cannot register a connection", async () => {
  const db = await withSync();
  await enable(db, "doppler", ["finance/records"]);
  await assert.rejects(
    () => db.query(
      `select business_os.register_source_connection(
        $1::uuid,
        (select id from business_os.projects where slug = 'doppler'),
        'staging',
        'https://source.example',
        'source-key-2',
        'BUSINESS_OS_SOURCE_DOPPLER_STAGING'
      )`,
      [readerId],
    ),
    /owner_required/,
  );
  await db.exec("begin");
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [readerId]);
  await db.exec("set local role authenticated");
  const visible = await db.query(`select id from business_os.source_connections`);
  await db.exec("commit");
  assert.equal(visible.rows.length, 1);
  await db.exec("begin");
  await db.exec("set local role anon");
  await assert.rejects(() => db.exec(`insert into business_os.source_connections default values`));
  await db.exec("rollback");
});
