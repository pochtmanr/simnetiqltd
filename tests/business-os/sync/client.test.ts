import assert from "node:assert/strict";
import test from "node:test";
import { signHex } from "@/contracts/business-os/v1/hmac-sign.mjs";
import { pullSigned } from "@/lib/business-os/sync/pull";
import { queryFor } from "@/lib/business-os/sync/query";
import { signGet } from "@/lib/business-os/sync/sign";
import { datasetsFromCapabilities, preferredBasis, validateContract } from "@/lib/business-os/sync/validate";
import { jobAuthorized } from "@/lib/business-os/sync/store";
import { mapRecord, mapRecordsPage } from "@/lib/business-os/sync/map";
import capabilities from "@/contracts/business-os/v1/fixtures/positive/capabilities-doppler.json";
import records from "@/contracts/business-os/v1/fixtures/positive/finance-records-sale-refund-reversal.json";
import sms from "@/contracts/business-os/v1/fixtures/positive/finance-records-sms-legacy-refund.json";
import overview from "@/contracts/business-os/v1/fixtures/positive/overview-partial-coverage.json";
import floatMoney from "@/contracts/business-os/v1/fixtures/negative/money-float.json";

const SECRET = "test-secret-do-not-use-in-production";
const claim = {
  endpoint: "finance/records",
  cursor: null,
  initial_from: "2026-01-01T00:00:00Z",
  initial_to: "2026-02-01T00:00:00Z",
  page_limit: 100,
  recognition_basis: "purchase",
  timezone: "Europe/London",
};

test("signs the frozen empty-body vector and canonicalizes query order", () => {
  const health = signGet({
    secret: SECRET,
    keyId: "bos_test_doppler_production_v1",
    path: "/api/business-os/v1/health",
    query: [],
    now: 1759017600 * 1000,
    nonce: "nonce-health-0001",
  });
  assert.equal(health.headers["X-BOS-Signature"], "8dc751a41ba6d4cd5bdf4cb05713f13bf1828714e53f02b3996c99f5533b5aab");

  const overviewSigned = signGet({
    secret: SECRET,
    keyId: "bos_test_doppler_production_v1",
    path: "/api/business-os/v1/overview",
    query: [
      ["to", "2026-09-27T23:00:00Z"],
      ["from", "2026-09-26T23:00:00Z"],
      ["basis", "purchase"],
    ],
    now: 1759017600 * 1000,
    nonce: "nonce-overview-0001",
  });
  assert.equal(
    overviewSigned.urlPath,
    "/api/business-os/v1/overview?basis=purchase&from=2026-09-26T23%3A00%3A00Z&to=2026-09-27T23%3A00%3A00Z",
  );
  assert.equal(overviewSigned.headers["X-BOS-Signature"], "c20b60ffa01349f16dae315b1279773f747b7feec0251901960131939db5d434");
  assert.equal(overviewSigned.headers["X-BOS-Signature"], signHex(SECRET, [
    "GET",
    overviewSigned.urlPath,
    "1759017600",
    "nonce-overview-0001",
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  ].join("\n")));
});

test("retries with a fresh nonce and honors Retry-After without calling a payment path", async () => {
  const paths: string[] = [];
  const nonces: string[] = [];
  let calls = 0;
  const result = await pullSigned(
    { claim, baseUrl: "https://source.example", keyId: "doppler-prod-1", secret: SECRET },
    {
      sleep: async () => {},
      inlineWaitMs: 2_000,
      fetchImpl: async (url, init) => {
        calls += 1;
        const parsed = new URL(url);
        paths.push(parsed.pathname + parsed.search);
        nonces.push(init.headers["X-BOS-Nonce"]);
        assert.equal(parsed.protocol, "https:");
        assert.match(parsed.pathname, /^\/api\/business-os\/v1\//);
        assert.equal(parsed.pathname.includes("revenuecat"), false);
        assert.equal(parsed.pathname.includes("webhook"), false);
        if (calls === 1) return new Response("{}", { status: 429, headers: { "retry-after": "1" } });
        return new Response(JSON.stringify(records), { status: 200, headers: { "content-type": "application/json" } });
      },
    },
  );
  assert.equal(result.kind, "ok");
  assert.equal(calls, 2);
  assert.notEqual(nonces[0], nonces[1]);
  assert.equal(paths.every((path) => path.startsWith("/api/business-os/v1/finance/records")), true);
});

test("a long Retry-After is scheduled instead of slept, and 503 becomes an outage", async () => {
  let delayed = 0;
  const limited = await pullSigned(
    { claim, baseUrl: "https://source.example", keyId: "doppler-prod-1", secret: SECRET },
    {
      sleep: async () => {
        delayed += 1;
      },
      fetchImpl: async () => new Response("{}", { status: 429, headers: { "retry-after": "30" } }),
    },
  );
  assert.equal(limited.kind, "retry");
  if (limited.kind === "retry") assert.equal(limited.retryAfterSeconds, 30);
  assert.equal(delayed, 0);

  let attempts = 0;
  const unavailable = await pullSigned(
    { claim, baseUrl: "https://source.example", keyId: "doppler-prod-1", secret: SECRET },
    {
      sleep: async () => {},
      fetchImpl: async () => {
        attempts += 1;
        return new Response("{}", { status: 503 });
      },
    },
  );
  assert.equal(unavailable.kind, "outage");
  assert.equal(attempts, 3);
});

test("a timed-out response is an outage and the next attempt uses a new nonce", async () => {
  const nonces: string[] = [];
  const result = await pullSigned(
    { claim, baseUrl: "https://source.example", keyId: "doppler-prod-1", secret: SECRET },
    {
      timeoutMs: 20,
      sleep: async () => {},
      inlineWaitMs: 0,
      fetchImpl: async (_url, init) => {
        nonces.push(init.headers["X-BOS-Nonce"]);
        await new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(init.signal.reason));
        });
        return new Response("{}", { status: 200 });
      },
    },
  );
  assert.equal(result.kind, "outage");
  if (result.kind === "outage") assert.equal(result.code, "timeout");
  assert.equal(nonces.length, 3);
  assert.equal(new Set(nonces).size, 3);
});

test("capabilities select datasets and the contract schemas accept the frozen fixtures", () => {
  assert.equal(validateContract("capabilities", capabilities), true);
  assert.equal(validateContract("recordsPage", records), true);
  assert.equal(validateContract("overview", overview), true);
  assert.equal(validateContract("recordsPage", floatMoney), false);
  assert.equal(preferredBasis(capabilities.supported_bases), "purchase");
  assert.equal(datasetsFromCapabilities(capabilities).includes("analytics/ga4_overview_daily"), false);
  assert.equal(datasetsFromCapabilities(capabilities).includes("finance/records"), true);
  assert.deepEqual(queryFor({ ...claim, endpoint: "capabilities" }).pairs, []);
});

test("record mapping keeps source identity and does not post legacy or void rows", () => {
  const connection = {
    project_slug: "doppler",
    environment: "production",
    source_environment: "production",
    recognition_basis: "purchase",
  };
  const mapped = mapRecordsPage(records as never, connection);
  assert.equal(mapped.quarantine.length, 0);
  assert.equal(mapped.records[0]?.posting, true);
  assert.equal(mapped.records[0]?.debit_account, "clearing-gbp");
  assert.equal(mapped.records[0]?.credit_account, "revenue-gbp");
  const wrong = mapRecordsPage(
    { ...records, records: [{ ...records.records[0], project_id: "smscode" }] } as never,
    connection,
  );
  assert.equal(wrong.quarantine[0]?.detail, "project_mismatch");
  const legacy = mapRecord(sms.records[0] as never, connection);
  assert.equal(legacy.posting, false);
  assert.equal(legacy.recognition_basis, "sms_legacy");
  assert.equal(legacy.counts_as_new_revenue, false);
});

test("job authorization compares the bearer token without accepting a missing secret", () => {
  assert.equal(jobAuthorized("Bearer secret-value", null), false);
  assert.equal(jobAuthorized("Bearer secret-value", "other"), false);
  assert.equal(jobAuthorized("Bearer secret-value", "secret-value"), true);
});
