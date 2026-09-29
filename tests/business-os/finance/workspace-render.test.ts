import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceSection } from "@/components/business-os/sections";
import { BusinessWorkspace } from "@/components/business-os/workspace";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

const query: WorkspaceQuery = {
  section: "overview",
  grain: "month",
  basis: "purchase",
  anchor: "2026-09-01",
  from: "2026-08-31T23:00:00.000Z",
  to: "2026-09-30T23:00:00.000Z",
  project: null,
  currency: null,
  source: null,
  status: null,
  metric: null,
};

const data: WorkspaceData = {
  projects: [{ id: "p1", slug: "doppler", name: "Doppler", state: "unverified", reportingEnabled: false }],
  categories: { rows: [{ code: "software", name: "Software" }] },
  company: {
    error: null,
    report: {
      basis: "purchase",
      grain: "month",
      coverage: "partial",
      exclusions: [{ projectSlug: "smscode", reason: "no_rows_for_basis", included: false }],
      buckets: [
        {
          from: query.from,
          to: query.to,
          partial: true,
          native: [
            {
              currency: "GBP",
              coverage: "partial",
              metrics: {
                gross_customer_sales: { amount: null, currency: "GBP", quality: "unavailable", reason: "no_sale_evidence", coverage: "missing" },
                net_proceeds: { amount: "4.00", currency: "GBP", quality: "estimated", reason: "estimated_fees", coverage: "partial" },
                direct_costs: { amount: null, currency: "GBP", quality: "unavailable", reason: "missing_direct_costs", coverage: "missing" },
                operating_expenses: { amount: "0.00", currency: "GBP", quality: "actual", reason: null, coverage: "complete" },
                operating_profit: { amount: null, currency: "GBP", quality: "unavailable", reason: "incomplete_operating_profit", coverage: "missing" },
                net_profit: { amount: null, currency: "GBP", quality: "unavailable", reason: "incomplete_other_income_financing_or_tax", coverage: "missing" },
              },
            },
          ],
          gbp: { reason: "missing_fx", policyVersion: null, metrics: null },
          allocation: { profit_before: null, allocation: null, profit_after: null, company_cost: null, unallocated: null, reason: "missing_fx" },
          cash: {
            balances: [{ snapshotKind: "cash", asOf: query.to, amount: "10.00", currency: "GBP", additive: false }],
            movements: [{ kind: "top_up", amount: "3.00", currency: "GBP" }],
            residuals: [{ amount: "1.00", currency: "GBP" }],
          },
          legacy: null,
        },
      ],
    },
  },
  byProject: [],
  drill: null,
  observations: { rows: [] },
  expenses: {
    rows: [
      {
        id: "e1",
        workflowKind: "expense",
        sourceOwner: "project",
        projectSlug: "doppler",
        status: "posted",
        vendor: "Host",
        amount: "2.00",
        currency: "GBP",
        dueOn: null,
        paidOn: null,
        serviceOn: null,
        taxAmount: null,
        postedEntryId: null,
        allocations: [],
      },
    ],
  },
  snapshots: { rows: [] },
  health: { rows: [{ connectionId: "c1", status: "outage", lastSuccessAt: null, lastErrorCode: "timeout" }] },
  connections: [],
  gates: { rows: [{ projectSlug: "doppler", dataset: "finance/balances", basis: "purchase", state: "unverified" }] },
  runs: { rows: [] },
  quarantine: { rows: [] },
};

function html(section: WorkspaceQuery["section"], extra: Partial<WorkspaceData> = {}) {
  return renderToStaticMarkup(
    createElement(WorkspaceSection, {
      surface: "admin",
      base: "/admin",
      query: { ...query, section },
      data: { ...data, ...extra },
      canWrite: true,
    }),
  );
}

const profile = {
  userId: "u1",
  organizationId: "o1",
  organizationSlug: "simnetiq",
  role: "owner" as const,
  assurance: "aal2" as const,
  telegramLinked: true,
  sessionId: "s1",
  projects: data.projects,
};

function workspaceHtml(surface: "admin" | "tg", section: WorkspaceQuery["section"], extra: Partial<WorkspaceData> = {}) {
  return renderToStaticMarkup(
    createElement(BusinessWorkspace, {
      surface,
      base: surface === "tg" ? "/tg" : "/admin",
      query: { ...query, section },
      data: { ...data, ...extra },
      profile,
      brokerEnabled: false,
      telegramConfigured: false,
    }),
  );
}

test("overview renders unavailable money distinctly from an estimate and an actual zero", () => {
  const markup = html("overview");
  assert.match(markup, /Unavailable/);
  assert.match(markup, /estimated/);
  assert.match(markup, /0\.00 GBP/);
  assert.match(markup, /Unverified cash balance/);
  assert.match(markup, /not revenue/);
  assert.match(markup, /Frozen SMS legacy snapshot is absent/);
  assert.match(markup, /Source health is outage/);
  assert.doesNotMatch(markup, /placeholder/i);
});

test("source expenses stay read-only and documents stay unfinished", () => {
  assert.match(html("expenses"), /Edited in the source project/);
  assert.match(html("documents"), /not available in this workspace yet/);
  assert.match(html("traffic"), /Distinct users stay with their provider/);
  assert.match(html("traffic"), /Visitor totals stay unavailable/);
  assert.match(html("subscriptions"), /MRR stays unavailable/);
});

test("overview shows project performance and does not invent a figure for a failed project", () => {
  const markup = html("overview", {
    byProject: [
      {
        slug: "doppler",
        error: null,
        report: {
          basis: "purchase",
          grain: "month",
          coverage: "partial",
          exclusions: [],
          buckets: [
            {
              from: query.from,
              to: query.to,
              partial: true,
              native: [
                {
                  currency: "USD",
                  coverage: "partial",
                  metrics: {
                    gross_customer_sales: { amount: "9.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    net_proceeds: { amount: "8.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    direct_costs: { amount: null, currency: "USD", quality: "unavailable", reason: "missing_direct_costs", coverage: "missing" },
                    operating_expenses: { amount: null, currency: "USD", quality: "unavailable", reason: null, coverage: "missing" },
                    operating_profit: { amount: "1.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    net_profit: { amount: null, currency: "USD", quality: "unavailable", reason: null, coverage: "missing" },
                  },
                },
              ],
              gbp: { reason: null, policyVersion: null, metrics: null },
              allocation: { profit_before: null, allocation: null, profit_after: null, company_cost: null, unallocated: null, reason: null },
              cash: { balances: [], movements: [], residuals: [] },
              legacy: null,
            },
          ],
        },
      },
      { slug: "smscode", report: null, error: "permission_denied" },
    ],
  });
  assert.match(markup, /9\.00 USD/);
  assert.match(markup, /8\.00 USD/);
  assert.match(markup, /1\.00 USD/);
  assert.match(markup, /project=doppler/);
  assert.match(markup, /permission denied/);
  assert.doesNotMatch(markup, /smscode[\s\S]{0,240}0\.00/);
});

test("gbp cards drill through with basis and window", () => {
  const report = data.company.report;
  assert.ok(report);
  const markup = html("overview", {
    company: {
      error: null,
      report: {
        ...report,
        buckets: report.buckets.map((bucket) => ({
          ...bucket,
          gbp: { reason: null, policyVersion: "fx-v1", metrics: bucket.native[0]?.metrics ?? null },
        })),
      },
    },
  });
  assert.match(markup, /<h3[^>]*>GBP<\/h3>[\s\S]*metric=gross_customer_sales[\s\S]*purchase/);
  assert.match(markup, /<h3[^>]*>GBP<\/h3>[\s\S]*2026-08-31T23:00:00.000Z to 2026-09-30T23:00:00.000Z/);
});

test("overview shows the last successful sync", () => {
  const markup = html("overview", {
    connections: [
      {
        id: "c1",
        projectSlug: "doppler",
        environment: "production",
        baseUrl: "https://example.test",
        secretReference: "BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION",
      },
    ],
    health: { rows: [{ connectionId: "c1", status: "ok", lastSuccessAt: "2026-09-29T12:00:00.000Z", lastErrorCode: null }] },
  });
  assert.match(markup, /doppler · production · ok · 2026-09-29T12:00:00.000Z/);
});

test("money and more link the remaining desktop sections", () => {
  assert.match(html("money"), /section=subscriptions/);
  assert.match(html("money"), /section=reports/);
  assert.match(html("more"), /section=integrations/);
});

test("reports show the active figures above the csv link", () => {
  const markup = html("reports");
  const csvAt = markup.indexOf("Download CSV");
  const salesAt = markup.indexOf(">Sales<");
  assert.ok(salesAt >= 0 && csvAt > salesAt);
  assert.match(markup, /\/api\/business-os\/finance\/exports\/csv\?/);
  assert.match(markup, /4\.00 GBP/);
});

test("tg home shows the period, headline figures, and project rows", () => {
  const markup = workspaceHtml("tg", "overview", {
    byProject: [
      {
        slug: "doppler",
        error: null,
        report: {
          basis: "purchase",
          grain: "month",
          coverage: "partial",
          exclusions: [],
          buckets: [
            {
              from: query.from,
              to: query.to,
              partial: true,
              native: [
                {
                  currency: "USD",
                  coverage: "partial",
                  metrics: {
                    gross_customer_sales: { amount: "9.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    net_proceeds: { amount: "8.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    direct_costs: { amount: null, currency: "USD", quality: "unavailable", reason: "missing_direct_costs", coverage: "missing" },
                    operating_expenses: { amount: null, currency: "USD", quality: "unavailable", reason: null, coverage: "missing" },
                    operating_profit: { amount: "1.00", currency: "USD", quality: "actual", reason: null, coverage: "partial" },
                    net_profit: { amount: null, currency: "USD", quality: "unavailable", reason: null, coverage: "missing" },
                  },
                },
              ],
              gbp: { reason: null, policyVersion: null, metrics: null },
              allocation: { profit_before: null, allocation: null, profit_after: null, company_cost: null, unallocated: null, reason: null },
              cash: { balances: [], movements: [], residuals: [] },
              legacy: null,
            },
          ],
        },
      },
      { slug: "smscode", report: null, error: "permission_denied" },
    ],
  });
  assert.match(markup, /<h1[^>]*>September 2026<\/h1>/);
  assert.doesNotMatch(markup, /<h1[^>]*>Telegram<\/h1>/);
  assert.match(markup, /Unavailable/);
  assert.match(markup, /4\.00 GBP/);
  assert.doesNotMatch(markup, /0\.00 GBP/);
  assert.match(markup, /Attention/);
  assert.match(markup, /Report coverage is partial/);
  assert.match(markup, /9\.00 USD/);
  assert.match(markup, /8\.00 USD/);
  assert.match(markup, /1\.00 USD/);
  assert.match(markup, /project=doppler/);
  assert.match(markup, /permission denied/);
  assert.doesNotMatch(markup, /smscode[\s\S]{0,240}0\.00/);
  assert.match(markup, /Month · purchase · 2026-09-01 · All projects/);
  assert.match(markup, /name="currency"/);
  assert.match(markup, /name="from"/);
  assert.match(markup, /name="status"/);
  assert.match(markup, /section=add/);
  assert.match(markup, /No source connection is registered/);
});

test("tg home shows verified cash when attention is empty", () => {
  const report = data.company.report;
  assert.ok(report);
  const markup = workspaceHtml("tg", "overview", {
    company: {
      error: null,
      report: {
        ...report,
        coverage: "complete",
        exclusions: [],
        buckets: report.buckets.map((bucket) => ({
          ...bucket,
          cash: { ...bucket.cash, residuals: [] },
        })),
      },
    },
    health: { rows: [{ connectionId: "c1", status: "ok", lastSuccessAt: "2026-09-29T12:00:00.000Z", lastErrorCode: null }] },
    gates: { rows: [{ projectSlug: "doppler", dataset: "finance/balances", basis: "purchase", state: "verified" }] },
  });
  assert.match(markup, /10\.00 GBP/);
  assert.match(markup, /Verified cash/);
  assert.match(markup, /section=accounts/);
  assert.doesNotMatch(markup, /Attention/);
});

test("tg money, more, documents, and reports stay in the same system", () => {
  assert.match(workspaceHtml("tg", "money"), /section=subscriptions/);
  assert.match(workspaceHtml("tg", "money"), /section=reports/);
  assert.match(workspaceHtml("tg", "money"), /Source health is outage/);
  assert.match(workspaceHtml("tg", "more"), /section=integrations/);
  assert.match(workspaceHtml("tg", "more"), /section=timeline/);
  assert.match(workspaceHtml("tg", "documents"), /not available in this workspace yet/);
  assert.match(workspaceHtml("tg", "documents"), /rounded-2xl/);
  const reports = workspaceHtml("tg", "reports");
  assert.match(reports, /0\.00 GBP/);
  assert.match(reports, /Unavailable/);
  assert.match(reports, /not revenue/);
  assert.match(reports, /not additive/);
  assert.match(reports, /Unverified cash balance/);
  assert.match(reports, /Frozen SMS legacy snapshot is absent/);
});

test("admin keeps the sidebar and inline filters", () => {
  const markup = workspaceHtml("admin", "overview");
  assert.match(markup, /<h1[^>]*>Admin<\/h1>/);
  assert.match(markup, /md:w-52/);
  assert.match(markup, /Apply filters/);
  assert.match(markup, /0\.00 GBP/);
  assert.doesNotMatch(markup, /<summary/);
  assert.doesNotMatch(markup, /grid-cols-5/);
});
