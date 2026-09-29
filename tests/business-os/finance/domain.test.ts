import assert from "node:assert/strict";
import test from "node:test";
import { assertFinanceWriter, BusinessOsError } from "@/lib/business-os/auth/authorize";
import { splitExact } from "@/lib/business-os/finance/allocate";
import { csvScopeFromReport, escapeCsvCell, formatFinanceCsv, instantInWindow } from "@/lib/business-os/finance/csv";
import { londonDate, londonWindow } from "@/lib/business-os/finance/london";
import { MoneyError, assertDecimal, compareDecimal, minorUnits } from "@/lib/business-os/finance/money";
import { marginRatio, netProfit } from "@/lib/business-os/finance/reporting";
import { drillQuery, evidenceKind, reportQuery } from "@/lib/business-os/finance/reconcile";
import { financeRpcStatus } from "@/lib/business-os/finance/rpc-status";

test("decimal strings reject floats, excess scale, and unknown fiat", () => {
  assertDecimal("1500", { currency: "JPY" });
  assertDecimal("1.234", { currency: "KWD" });
  assertDecimal("0.123456789012345678", { asset: "BTC", network: "bitcoin" });
  assert.throws(() => assertDecimal("1.5", { currency: "JPY" }), MoneyError);
  assert.throws(() => assertDecimal("1.2345", { currency: "KWD" }), MoneyError);
  assert.throws(() => assertDecimal("0.1234567890123456789", { asset: "BTC", network: "bitcoin" }), MoneyError);
  assert.throws(() => assertDecimal("10.00", { currency: "XXX" }), MoneyError);
  assert.throws(() => assertDecimal("10.201", { currency: "USD" }), MoneyError);
  assert.equal(compareDecimal("-15.00", "0"), -1);
});

test("exact allocation shares sum to the total", () => {
  const shares = splitExact("10.00", [1n, 1n, 1n], 2);
  assert.deepEqual(shares, ["3.34", "3.33", "3.33"]);
  const total = shares.reduce((sum, share) => sum + minorUnits(share, 2), 0n);
  assert.equal(total, 1000n);
});

test("margin and net profit stay null when a component or denominator is missing", () => {
  assert.equal(netProfit({ operating: "10.00", otherIncome: null, financing: "0.00", tax: "0.00", complete: true }), null);
  assert.equal(netProfit({ operating: "10.00", otherIncome: "0.00", financing: "0.00", tax: "0.00", complete: false }), null);
  assert.equal(marginRatio("20.00", "0.00"), null);
  assert.equal(marginRatio("20.00", "-1.00"), null);
  assert.equal(marginRatio(null, "100.00"), null);
  assert.equal(compareDecimal(marginRatio("20.00", "100.00") ?? "", "0.2"), 0);
});

test("London reporting dates follow DST and month boundaries", () => {
  assert.equal(londonDate(new Date("2026-03-29T00:30:00Z")), "2026-03-29");
  assert.equal(londonDate(new Date("2026-03-29T01:00:00Z")), "2026-03-29");
  assert.equal(londonDate(new Date("2026-03-29T23:00:00Z")), "2026-03-30");
  assert.equal(londonDate(new Date("2026-05-31T23:00:00Z")), "2026-06-01");
  assert.equal(londonDate(new Date("2026-01-31T23:30:00Z")), "2026-01-31");
  assert.equal(londonDate(new Date("2026-12-31T23:30:00Z")), "2026-12-31");
  assert.equal(londonDate(new Date("2025-12-31T23:30:00Z")), "2025-12-31");
  assert.equal(londonDate(new Date("2026-10-25T00:30:00Z")), "2026-10-25");
  assert.equal(londonDate(new Date("2026-10-25T01:30:00Z")), "2026-10-25");
});

test("csv cells cannot start an executable spreadsheet formula", () => {
  assert.equal(escapeCsvCell("=cmd"), "'=cmd");
  assert.equal(escapeCsvCell("+1"), "'+1");
  assert.equal(escapeCsvCell("-1"), "'-1");
  assert.equal(escapeCsvCell("@sum"), "'@sum");
  const csv = formatFinanceCsv({
    basis: "purchase",
    coverage: "partial",
    rows: [
      {
        account: "opex-gbp",
        side: "debit",
        originalAmount: "=10",
        originalCurrency: "GBP",
        gbpAmount: null,
        effectiveAt: "2026-05-01",
      },
    ],
  });
  assert.match(csv, /basis,coverage/);
  assert.match(csv, /'=10,GBP,,2026-05-01,purchase,partial/);
  assert.doesNotMatch(csv, /(^|\n)=10/);
});

test("csv coverage comes from the report and lines stay inside the window", () => {
  assert.equal(csvScopeFromReport({ basis: "purchase" }), null);
  const scope = csvScopeFromReport({ basis: "purchase", coverage: "partial" });
  assert.equal(scope?.basis, "purchase");
  assert.equal(scope?.coverage, "partial");
  assert.equal(instantInWindow("2026-05-01T00:00:00Z", "2026-05-01T00:00:00Z", "2026-06-01T00:00:00Z"), true);
  assert.equal(instantInWindow("2026-06-01T00:00:00Z", "2026-05-01T00:00:00Z", "2026-06-01T00:00:00Z"), false);
  assert.equal(instantInWindow("2026-04-30T23:00:00Z", "2026-05-01T00:00:00Z", "2026-06-01T00:00:00Z"), false);
});

test("London month windows land on civil month boundaries", () => {
  const march = londonWindow("month", new Date("2026-03-15T12:00:00Z"));
  assert.equal(londonDate(new Date(march.from)), "2026-03-01");
  assert.equal(londonDate(new Date(march.to)), "2026-04-01");
  const october = londonWindow("month", new Date("2026-10-15T12:00:00Z"));
  assert.equal(londonDate(new Date(october.from)), "2026-10-01");
  assert.equal(londonDate(new Date(october.to)), "2026-11-01");
});

test("finance rpc failures map to client statuses and read-only cannot write", () => {
  assert.equal(financeRpcStatus("reader_forbidden"), 403);
  assert.equal(financeRpcStatus("duplicate_origin"), 409);
  assert.equal(financeRpcStatus("period_locked"), 409);
  assert.equal(financeRpcStatus("amount_scale"), 400);
  assert.equal(financeRpcStatus("basis_invalid"), 422);
  assert.equal(financeRpcStatus("interval_too_large"), 422);
  assert.equal(financeRpcStatus("synthetic_evidence"), 409);
  assert.throws(() => assertFinanceWriter("read_only"), BusinessOsError);
  assertFinanceWriter("owner");
  assertFinanceWriter("admin");
});

test("report queries reject a live evidence claim", () => {
  const params = new URLSearchParams({
    project: "doppler",
    from: "2026-06-01T00:00:00Z",
    to: "2026-07-01T00:00:00Z",
    basis: "purchase",
    grain: "month",
  });
  assert.equal(reportQuery(params).grain, "month");
  assert.equal("error" in reportQuery(new URLSearchParams({ basis: "purchase" })), true);
  assert.equal(drillQuery(params).error, "invalid_body");
  params.set("metric", "gross_customer_sales");
  assert.equal(drillQuery(params).metric, "gross_customer_sales");
  assert.deepEqual(evidenceKind(undefined), { kind: "synthetic" });
  assert.deepEqual(evidenceKind("live"), { error: "live_evidence_unavailable" });
});
