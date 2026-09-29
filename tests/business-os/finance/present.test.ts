import assert from "node:assert/strict";
import test from "node:test";
import {
  displayAmount,
  readMetric,
  subscriptionView,
  trafficPresentation,
  type TrafficReport,
} from "@/lib/business-os/workspace/present";

test("a null metric stays unavailable and an estimate keeps its quality", () => {
  const missing = displayAmount(readMetric({ amount: null, currency: "GBP", quality: "unavailable", reason: "no_sale_evidence", coverage: "missing" }));
  assert.equal(missing.text, "Unavailable");
  assert.equal(missing.quality, "unavailable");
  assert.notEqual(missing.text, "0");
  assert.notEqual(missing.text, "0.00 GBP");
  const estimated = displayAmount(readMetric({ amount: "1.50", currency: "GBP", quality: "estimated", reason: "estimated_component", coverage: "partial" }));
  assert.equal(estimated.text, "1.50 GBP");
  assert.equal(estimated.quality, "estimated");
  const zero = displayAmount(readMetric({ amount: "0.00", currency: "GBP", quality: "actual", coverage: "complete" }));
  assert.equal(zero.text, "0.00 GBP");
});

test("analytics rows are not summed into a visitor total", () => {
  const daily: TrafficReport = {
    project: "doppler",
    provider: "ga4",
    report: "ga4_overview_daily",
    availability: "available",
    reason: null,
    sourceTimezone: "Europe/London",
    grain: "day",
    status: "current",
    dataAsOf: null,
    rows: [{ active_users: 10 }, { active_users: 11 }],
    completePropertyTotal: true,
    limitations: [],
  };
  const period: TrafficReport = {
    ...daily,
    report: "ga4_period_unique_users",
    rows: [{ active_users: 18 }],
  };
  const dimensions: TrafficReport = {
    ...daily,
    provider: "gsc",
    report: "gsc_dimension_rows",
    sourceTimezone: "America/Los_Angeles",
    rows: [{ query: "vpn", clicks: 2 }],
    completePropertyTotal: false,
  };
  const view = trafficPresentation([daily, period, dimensions]);
  assert.equal(view.combinedDistinctUsers, null);
  assert.equal(view.dailyUniqueSum, null);
  assert.equal(view.dimensionRowsAreTotals, false);
  assert.equal(view.dailyRows.length, 2);
  assert.equal(view.periodHeadlines.length, 1);
  assert.equal(view.periodHeadlines[0]?.rows[0]?.active_users, 18);
  assert.equal(view.dimensionReports.length, 1);
});

test("an unsupported subscription does not become zero MRR", () => {
  const view = subscriptionView({ supported: false, reason: "not_applicable", metrics: null, warnings: ["MRR is unsupported, not zero."] });
  assert.equal(view.state, "unsupported");
  if (view.state === "unsupported") assert.equal(view.reason, "not_applicable");
});
