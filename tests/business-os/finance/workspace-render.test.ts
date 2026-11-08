import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminSection } from "@/components/business-os/admin/sections";
import { WorkspaceSection } from "@/components/business-os/sections";
import { BusinessWorkspace } from "@/components/business-os/workspace";
import { ThemeProvider } from "@/components/theme-provider";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
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

function tgSection(section: WorkspaceQuery["section"], extra: Partial<WorkspaceData> = {}) {
  return renderToStaticMarkup(
    createElement(WorkspaceSection, {
      surface: "tg",
      base: "/tg",
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

/** Client sections call useRouter; static rendering has no app router, so give them an inert one. */
const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };

function html(section: WorkspaceQuery["section"], extra: Partial<WorkspaceData> = {}) {
  return renderToStaticMarkup(
    createElement(
      AppRouterContext.Provider,
      { value: router as never },
      createElement(AdminSection, {
        query: { ...query, section },
        data: { ...data, ...extra },
        profile,
        canWrite: true,
        brokerEnabled: false,
        telegramConfigured: false,
      }),
    ),
  );
}

function workspaceHtml(surface: "admin" | "tg", section: WorkspaceQuery["section"], extra: Partial<WorkspaceData> = {}) {
  const workspace = createElement(BusinessWorkspace, {
    surface,
    base: surface === "tg" ? "/tg" : "/admin",
    query: { ...query, section },
    data: { ...data, ...extra },
    profile,
    brokerEnabled: false,
    telegramConfigured: false,
  });
  return renderToStaticMarkup(
    surface === "admin" ? createElement(ThemeProvider, { initialChoice: "dark" }, workspace) : workspace,
  );
}

test("overview renders unavailable money distinctly from an estimate and an actual zero", () => {
  const markup = html("overview");
  assert.match(markup, /Unavailable/);
  assert.match(markup, /Estimated/);
  assert.match(markup, /Unverified cash balance/);
  assert.match(markup, /Source health is outage/);
  assert.doesNotMatch(markup, /placeholder/i);
  const statements = html("reports");
  assert.match(statements, /£0\.00/);
  assert.match(statements, /Unavailable/);
  assert.match(statements, /Frozen SMS legacy snapshot is absent/);
  const cash = html("accounts");
  assert.match(cash, /not revenue/);
  assert.match(cash, /£10\.00/);
  assert.match(cash, /not additive/);
});

test("source expenses stay read-only and registrations stay unfinished", () => {
  assert.match(html("expenses"), /edited in the source project and stays read-only/);
  assert.match(html("records"), /not available in this workspace yet/);
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
  assert.match(markup, /\$9\.00/);
  assert.match(markup, /\$8\.00/);
  assert.match(markup, /\$1\.00/);
  assert.match(markup, /project=doppler/);
  assert.match(markup, /permission denied/);
  assert.doesNotMatch(markup, /smscode[\s\S]{0,240}0\.00/);
});

test("gbp statement lines drill through with basis and window", () => {
  const report = data.company.report;
  assert.ok(report);
  const markup = html("reports", {
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
  assert.match(markup, /GBP \(converted\)[\s\S]*section=sales&amp;grain=month&amp;basis=purchase&amp;anchor=2026-09-01&amp;metric=gross_customer_sales/);
  assert.match(markup, /1 Sept? 2026 – 30 Sept? 2026/);
  assert.match(markup, /fx-v1/);
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
  assert.match(markup, /Doppler/);
  assert.match(markup, /production · synced/);
  assert.match(markup, /title="2026-09-29T12:00:00.000Z"/);
  assert.match(markup, /Healthy/);
});

test("money and more link the remaining desktop sections", () => {
  assert.match(tgSection("money"), /section=subscriptions/);
  assert.match(tgSection("money"), /section=reports/);
  assert.match(tgSection("more"), /section=integrations/);
});

test("statements show the active figures and the csv link", () => {
  const markup = html("reports");
  assert.ok(markup.indexOf(">Sales<") >= 0);
  assert.ok(markup.indexOf("Download CSV") >= 0);
  assert.match(markup, /\/api\/business-os\/finance\/exports\/csv\?/);
  assert.match(markup, /£4\.00/);
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

test("admin keeps the grouped sidebar, the mobile tab bar, and the period filters", () => {
  const markup = workspaceHtml("admin", "overview");
  assert.match(markup, /<h1[^>]*>Overview<\/h1>/);
  assert.match(markup, /class="bos-sidebar"/);
  assert.match(markup, />Dashboard<[\s\S]*>Money<[\s\S]*>Apps<[\s\S]*>Brain<[\s\S]*>Plan<[\s\S]*>System</);
  assert.match(markup, />Brain</);
  assert.match(markup, /class="bos-tabbar"/);
  assert.match(markup, /aria-label="Previous period"/);
  assert.match(markup, /September 2026/);
  assert.match(markup, /aria-label="Count sales when"/);
  assert.match(markup, />Filters</);
  assert.match(markup, /Unverified cash balance/);
  assert.doesNotMatch(markup, /<summary/);
  assert.doesNotMatch(markup, /grid-cols-5/);
  assert.doesNotMatch(markup, /bos-topbar/);
  assert.doesNotMatch(markup, /aria-label="Account and theme"/);
  assert.match(markup, /class="bos-side-foot"[\s\S]*>Account</);
});

test("today opens with a hub per product linking its Supabase, Vercel and sites", () => {
  const markup = html("home");
  assert.match(markup, /Doppler VPN[\s\S]*SMS Code[\s\S]*Up next/);
  assert.match(markup, /supabase\.com\/dashboard\/project\/fzlrhmjdjjzcgstaeblu/);
  assert.match(markup, /supabase\.com\/dashboard\/project\/zkuwqvtwlomktysuymyw/);
  assert.match(markup, /vercel\.com\/romans-projects-a19aa0c4\/dopplervpn/);
  assert.match(markup, /href="https:\/\/simnetiq\.xyz\/admin"/);
  assert.match(markup, /Microsoft Azure[\s\S]*🇸🇪[\s\S]*Sweden/);
  assert.match(markup, /href="https:\/\/my\.fotbo\.com\/openstack\/instances"[\s\S]*Netherlands/);
  assert.match(markup, /href="https:\/\/my\.digitalcloud\.pro\/"[\s\S]*St Petersburg/);
  assert.doesNotMatch(markup, /Provider not recorded/);
  assert.match(markup, /src="\/logos\/providers\/azure\.svg"/);
  assert.match(markup, /src="\/logos\/providers\/fotbo\.png"/);
  assert.match(markup, /src="\/logos\/providers\/digitalcloud\.png"/);
  assert.match(markup, /logos%2Fdoppler\.svg|logos\/doppler\.svg/);
  assert.match(markup, /logos%2Fsmscode\.svg|logos\/smscode\.svg/);
  assert.match(markup, /section=overview(?:&amp;|&)[^"]*project=doppler|project=doppler[^"]*section=overview/);
});

test("hub links carry their brand icon, with dark marks flagged for the dark theme", () => {
  const markup = html("home");
  assert.match(markup, /src="\/logos\/brands\/supabase\.svg"/);
  assert.match(markup, /src="\/logos\/brands\/telegram\.svg"[^>]*>[\s\S]*?Telegram mini app/);
  assert.match(markup, /src="\/logos\/brands\/vercel\.svg"[^>]*bos-hub-brand--dark/);
  assert.match(markup, /class="bos-hub-link__label">App Store Connect</);
});

test("each project has its own sidebar tab and page", () => {
  const markup = workspaceHtml("admin", "project", { ...data });
  assert.match(markup, /href="\/admin\?section=project[^"]*project=doppler"[^>]*>[\s\S]*?Doppler VPN/);
  assert.match(markup, /href="\/admin\?section=project[^"]*project=smscode"[^>]*>[\s\S]*?SMS Code/);

  const page = renderToStaticMarkup(
    createElement(
      ThemeProvider,
      { initialChoice: "dark" },
      createElement(BusinessWorkspace, {
        surface: "admin",
        base: "/admin",
        query: { ...query, section: "project", project: "smscode" },
        data,
        profile,
        brokerEnabled: false,
        telegramConfigured: false,
      }),
    ),
  );
  assert.match(page, /<h1 class="bos-title">SMS Code<\/h1>/);
  assert.match(page, /aria-current="page"[^>]*title="SMS Code"|title="SMS Code"[^>]*aria-current="page"/);
  assert.match(page, /href="https:\/\/simnetiq\.xyz\/admin"/);
  assert.doesNotMatch(page, /www\.dopplervpn\.org/);
  // Leaving a project page drops the project rather than carrying it in as a filter.
  assert.match(page, /href="\/admin\?section=sales&amp;grain=month&amp;basis=purchase&amp;anchor=2026-09-01"/);
});

const bankBase = {
  configured: true,
  connectedAt: null,
  lastRun: null,
  lastSuccessAt: null,
  accounts: [],
  transactions: [],
  truncated: false,
  rules: [],
};

test("bank before connecting explains setup, and only the owner sees Connect", () => {
  const unconfigured = html("bank", { bank: { ...bankBase, configured: false } });
  assert.match(unconfigured, /Not connected/);
  assert.match(unconfigured, /REVOLUT_CLIENT_ID/);
  assert.doesNotMatch(unconfigured, />Connect Revolut</);

  const ready = html("bank", { bank: bankBase });
  assert.match(ready, />Connect Revolut</);
  assert.match(ready, /No bank data yet/);
  assert.match(html("bank", { bank: { error: "unavailable" } }), /Bank data is unavailable/);
});

test("bank shows balances, cash flow by category, transactions and the callback notice", () => {
  const markup = html("bank", {
    bankNotice: "connected",
    bank: {
      ...bankBase,
      connectedAt: "2026-11-08T09:00:00Z",
      lastRun: { outcome: "committed", finishedAt: "2026-11-08T09:30:00Z", rows: 3 },
      lastSuccessAt: "2026-11-08T09:30:00Z",
      accounts: [{ id: "a1", name: "Main", currency: "GBP", balance: "1520.40", state: "active", asOf: "2026-11-08T09:30:00Z" }],
      transactions: [
        { id: "t1", accountId: "a1", kind: "card_payment", state: "completed", createdAt: "2026-09-03T10:00:00Z", completedAt: "2026-09-03T10:01:00Z", amount: "-42.50", fee: "0", currency: "GBP", description: "Microsoft*Azure", counterparty: "Microsoft Azure", reference: null, category: "hosting", categorySource: "rule" },
        { id: "t2", accountId: "a1", kind: "transfer", state: "completed", createdAt: "2026-09-04T10:00:00Z", completedAt: "2026-09-04T10:01:00Z", amount: "310.00", fee: "0", currency: "GBP", description: "Apple payout", counterparty: null, reference: null, category: null, categorySource: null },
      ],
      rules: [{ id: "r1", match: "azure", category: "hosting" }],
    },
  });
  assert.match(markup, /Revolut is connected and the first pull is in/);
  assert.match(markup, /Connected/);
  assert.match(markup, /Main · GBP/);
  assert.match(markup, /1,520\.40/);
  assert.match(markup, /Money in[\s\S]*310\.00/);
  assert.match(markup, /Hosting &amp; servers[\s\S]*42\.50/);
  assert.match(markup, /1 uncategorised transaction/);
  assert.match(markup, /Microsoft Azure/);
  assert.match(markup, /“azure”/);
  assert.match(markup, />Disconnect</);
});

test("an unknown project says so", () => {
  assert.match(renderToStaticMarkup(createElement(AdminSection, { query: { ...query, section: "project", project: "nope" }, data, profile, canWrite: true, brokerEnabled: false, telegramConfigured: false })), /No project called/);
});

test("account page holds account, security and app settings", () => {
  const markup = workspaceHtml("admin", "settings");
  assert.match(markup, />Account<[\s\S]*>Security<[\s\S]*>Settings</);
  assert.match(markup, />Match device</);
  assert.match(markup, />Log out</);
});

test("admin sources page lists connections, datasets, and unknown datasets generically", () => {
  const markup = html("integrations", {
    connections: [{ id: "c1", projectSlug: "doppler", environment: "production", baseUrl: "https://example.test", secretReference: "BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION" }],
    health: { rows: [{ connectionId: "c1", status: "degraded", lastSuccessAt: null, lastErrorCode: "timeout" }] },
    snapshots: {
      rows: [
        { dataset: "billing/invoices", snapshotId: "s1", status: "current", grain: "day", timezone: "UTC", coverage: "complete", dataAsOf: "2026-09-29T12:00:00.000Z", projectSlug: "doppler", connectionId: "c1", body: { rows: [{ invoice: "A1", total: "5.00" }] } },
      ],
    },
  });
  assert.match(markup, /Doppler/);
  assert.match(markup, /Degraded/);
  assert.match(markup, /Timeout/);
  assert.match(markup, /billing · invoices/);
  assert.match(markup, /BUSINESS_OS_SOURCE_DOPPLER_PRODUCTION/);
});

function isoDay(offset: number): string {
  const value = new Date();
  value.setUTCHours(12, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

test("today shows overdue actions, upcoming items, and skips past events", () => {
  const markup = html("home", {
    upcoming: {
      rows: [
        { kind: "service_renewal", sourceId: "r1", occursOn: isoDay(-3), title: "Domain renewal", projectSlug: null, editable: false },
        { kind: "manual", sourceId: "m1", occursOn: isoDay(-2), title: "Past meetup", projectSlug: null, editable: true },
        { kind: "finance_due", sourceId: "e1", occursOn: isoDay(4), title: "Hetzner", projectSlug: "doppler", editable: false },
      ],
    },
  });
  assert.match(markup, /Domain renewal[\s\S]*Overdue/);
  assert.match(markup, /Hetzner/);
  assert.match(markup, /Expense due · doppler/);
  assert.doesNotMatch(markup, /Past meetup/);
  assert.match(markup, /section=timeline/);
});

test("today says when the timeline cannot be read instead of showing nothing due", () => {
  assert.match(html("home", { upcoming: { error: "unavailable" } }), /timeline is unavailable/);
  assert.match(html("home", { upcoming: { rows: [] } }), /Nothing due/);
});

test("phase placeholders render for ask and app store", () => {
  assert.match(html("ask"), /Ask is coming next/);
  assert.match(html("appstore"), /App Store is coming next/);
});

const documentRow = {
  id: "d1",
  title: "Hetzner invoice",
  folder: "Finance/2026",
  origin: "central" as const,
  category: null,
  vendor: "Hetzner",
  tags: ["hosting"],
  projectSlug: null,
  documentOn: null,
  mimeType: "application/pdf",
  byteSize: 2048,
  uploadStatus: "stored",
  summary: null,
  createdAt: "2026-11-01T10:00:00.000Z",
};

test("files shows the folder tree, upload controls, and an empty root", () => {
  const markup = html("documents", { documents: { rows: [documentRow, { ...documentRow, id: "d2", title: "Half upload", folder: "", uploadStatus: "pending" }] } });
  assert.match(markup, /aria-label="Folders"/);
  assert.match(markup, />Finance</);
  assert.match(markup, />2026</);
  assert.match(markup, />Upload</);
  assert.match(markup, /Half upload/);
  assert.match(markup, /Incomplete/);
  assert.doesNotMatch(markup, /Hetzner invoice/);
});

test("files says when it cannot load instead of showing an empty folder", () => {
  assert.match(html("documents", { documents: { error: "unavailable" } }), /Files are unavailable/);
  assert.match(html("documents", { documents: { rows: [] } }), /No files yet/);
});

test("notes lists titles with counts and waits for a pick", () => {
  const markup = html("notes", {
    notes: {
      rows: [
        { id: "n1", title: "Roadmap", key: "roadmap", folder: "Plans", tags: ["plan"], documentId: null, updatedAt: "2026-11-08T10:00:00.000Z" },
        { id: "n2", title: "Pricing", key: "pricing", folder: "", tags: [], documentId: null, updatedAt: "2026-11-07T10:00:00.000Z" },
      ],
      links: [{ from: "n1", toKey: "pricing" }],
    },
  });
  assert.match(markup, /Roadmap/);
  assert.match(markup, /Pricing/);
  assert.match(markup, /2 notes · 1 link/);
  assert.match(markup, /Pick a note/);
  assert.match(markup, />Graph</);
  assert.match(markup, />Vault</);
});

test("notes says when it cannot load", () => {
  assert.match(html("notes", { notes: { error: "unavailable" } }), /Notes are unavailable/);
  assert.match(html("notes", { notes: { rows: [], links: [] } }), /Write your first note/);
});
