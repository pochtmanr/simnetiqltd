export type MoneyMetric = {
  amount: string | null;
  currency: string | null;
  quality: string;
  reason: string | null;
  coverage: string | null;
};

export type CurrencyBlock = {
  currency: string;
  coverage: string | null;
  metrics: Record<string, MoneyMetric | null>;
};

export type ReportBucket = {
  from: string | null;
  to: string | null;
  partial: boolean;
  native: CurrencyBlock[];
  gbp: { reason: string | null; policyVersion: string | null; metrics: Record<string, MoneyMetric | null> | null };
  allocation: Record<string, string | null>;
  cash: {
    balances: { snapshotKind: string; asOf: string | null; amount: string | null; currency: string | null; additive: boolean }[];
    movements: { kind: string; amount: string | null; currency: string | null }[];
    residuals: { amount: string | null; currency: string | null }[];
  };
  legacy: LegacyBridge | null;
};

export type LegacyBridge = {
  formulaVersion: string | null;
  currency: string | null;
  preserved: Record<string, string | null> | null;
  legacyNetAmount: string | null;
  realSpend: null;
  realSpendReason: string | null;
  warnings: string[];
};

export type FinancialReportView = {
  basis: string | null;
  grain: string | null;
  coverage: string | null;
  exclusions: { projectSlug: string; reason: string; included: boolean }[];
  buckets: ReportBucket[];
};

export type TrafficReport = {
  project: string;
  provider: string;
  report: string;
  availability: string;
  reason: string | null;
  sourceTimezone: string | null;
  grain: string | null;
  status: string;
  dataAsOf: string | null;
  rows: Record<string, unknown>[];
  completePropertyTotal: boolean | null;
  limitations: string[];
};

const HEADLINE_METRICS = ["gross_customer_sales", "net_proceeds", "direct_costs", "operating_expenses", "operating_profit", "net_profit"] as const;

export const OVERVIEW_METRICS = HEADLINE_METRICS;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function readMetric(value: unknown): MoneyMetric | null {
  const row = record(value);
  if (!row) return null;
  if (row.amount !== null && row.amount !== undefined && typeof row.amount !== "string") {
    return {
      amount: null,
      currency: text(row.currency),
      quality: "unavailable",
      reason: "amount_unreadable",
      coverage: "missing",
    };
  }
  return {
    amount: row.amount === undefined ? null : (row.amount as string | null),
    currency: text(row.currency),
    quality: text(row.quality) ?? "unavailable",
    reason: text(row.reason),
    coverage: text(row.coverage),
  };
}

export function displayAmount(metric: MoneyMetric | null): { text: string; quality: string; reason: string | null } {
  if (!metric || metric.amount === null) {
    return { text: "Unavailable", quality: metric?.quality ?? "unavailable", reason: metric?.reason ?? null };
  }
  return {
    text: metric.currency ? `${metric.amount} ${metric.currency}` : metric.amount,
    quality: metric.quality,
    reason: metric.reason,
  };
}

function metricsOf(value: unknown): Record<string, MoneyMetric | null> {
  const row = record(value);
  const metrics: Record<string, MoneyMetric | null> = {};
  for (const name of HEADLINE_METRICS) metrics[name] = readMetric(row?.[name]);
  return metrics;
}

function allocationOf(value: unknown): Record<string, string | null> {
  const row = record(value) ?? {};
  const keys = ["profit_before", "allocation", "profit_after", "company_cost", "unallocated", "reason"];
  const result: Record<string, string | null> = {};
  for (const key of keys) result[key] = text(row[key]);
  return result;
}

function legacyOf(value: unknown): LegacyBridge | null {
  const row = record(value);
  if (!row) return null;
  const preserved = record(row.preserved);
  return {
    formulaVersion: text(row.formula_version),
    currency: text(row.currency),
    preserved: preserved
      ? {
          gross: text(preserved.gross),
          apple_fee: text(preserved.apple_fee),
          refunds: text(preserved.refunds),
          cash_net: text(preserved.cash_net),
        }
      : null,
    legacyNetAmount: text(row.legacy_net_amount),
    realSpend: null,
    realSpendReason: text(row.real_spend_reason),
    warnings: stringList(row.warnings),
  };
}

function bucketOf(value: unknown): ReportBucket | null {
  const row = record(value);
  if (!row) return null;
  const native = Array.isArray(row.native_currency_subtotals) ? row.native_currency_subtotals : [];
  const gbp = record(row.gbp);
  const cash = record(row.cash);
  return {
    from: text(row.from),
    to: text(row.to),
    partial: row.partial === true,
    native: native.flatMap((item) => {
      const block = record(item);
      if (!block || typeof block.currency !== "string") return [];
      return [
        {
          currency: block.currency,
          coverage: text(block.coverage),
          metrics: metricsOf(block.metrics),
        },
      ];
    }),
    gbp: {
      reason: text(gbp?.reason),
      policyVersion: text(gbp?.policy_version),
      metrics: gbp && gbp.metrics ? metricsOf(gbp.metrics) : null,
    },
    allocation: allocationOf(row.allocation),
    cash: {
      balances: Array.isArray(cash?.balances)
        ? cash.balances.flatMap((item) => {
            const balance = record(item);
            if (!balance) return [];
            return [
              {
                snapshotKind: text(balance.snapshot_kind) ?? "unknown",
                asOf: text(balance.as_of),
                amount: text(balance.amount),
                currency: text(balance.currency),
                additive: false,
              },
            ];
          })
        : [],
      movements: Array.isArray(cash?.movements)
        ? cash.movements.flatMap((item) => {
            const movement = record(item);
            if (!movement) return [];
            return [{ kind: text(movement.kind) ?? "movement", amount: text(movement.amount), currency: text(movement.currency) }];
          })
        : [],
      residuals: Array.isArray(cash?.residuals)
        ? cash.residuals.flatMap((item) => {
            const residual = record(item);
            if (!residual) return [];
            return [{ amount: text(residual.amount), currency: text(residual.currency) }];
          })
        : [],
    },
    legacy: legacyOf(row.legacy_bridge),
  };
}

export function parseReport(value: unknown): FinancialReportView | null {
  const row = record(value);
  if (!row) return null;
  const exclusions = Array.isArray(row.exclusions) ? row.exclusions : [];
  const buckets = Array.isArray(row.buckets) ? row.buckets : [];
  return {
    basis: text(row.basis),
    grain: text(row.grain),
    coverage: text(row.coverage),
    exclusions: exclusions.flatMap((item) => {
      const exclusion = record(item);
      if (!exclusion || typeof exclusion.project_slug !== "string" || typeof exclusion.reason !== "string") return [];
      return [{ projectSlug: exclusion.project_slug, reason: exclusion.reason, included: exclusion.included === true }];
    }),
    buckets: buckets.flatMap((item) => {
      const bucket = bucketOf(item);
      return bucket ? [bucket] : [];
    }),
  };
}

export function attentionItems(input: {
  coverage: string | null;
  exclusions: { projectSlug: string; reason: string }[];
  health: { status: string; lastErrorCode: string | null }[];
  staleDatasets: string[];
  unmatchedCount: number;
  unverifiedGates: number;
}): string[] {
  const items: string[] = [];
  if (input.coverage && input.coverage !== "complete") items.push(`Report coverage is ${input.coverage}.`);
  for (const exclusion of input.exclusions) items.push(`${exclusion.projectSlug}: ${exclusion.reason}.`);
  for (const row of input.health) {
    if (row.status !== "ok") items.push(`Source health is ${row.status}${row.lastErrorCode ? ` (${row.lastErrorCode})` : ""}.`);
  }
  for (const dataset of input.staleDatasets) items.push(`${dataset} snapshot is stale.`);
  if (input.unmatchedCount > 0) items.push(`${input.unmatchedCount} unmatched settlement${input.unmatchedCount === 1 ? "" : "s"}.`);
  if (input.unverifiedGates > 0) items.push(`${input.unverifiedGates} dataset gates are unverified.`);
  return items;
}

export function balancesVerified(gates: { dataset: string; basis: string; state: string }[], basis: string): boolean {
  const rows = gates.filter((gate) => gate.dataset === "finance/balances" && gate.basis === basis);
  return rows.length > 0 && rows.every((gate) => gate.state === "verified");
}

export function cashCaption(kind: string, verified: boolean): string {
  if (kind === "cash" && verified) return "Verified cash";
  if (kind === "cash") return "Unverified cash balance";
  return `${kind.replaceAll("_", " ")} balance`;
}

export function readTrafficReports(
  rows: { projectSlug: string | null; dataset: string; status: string; grain: string | null; timezone: string | null; dataAsOf: string | null; body: unknown }[],
): TrafficReport[] {
  return rows.flatMap((row) => {
    if (!row.dataset.startsWith("analytics/")) return [];
    const body = record(row.body);
    if (!body) return [];
    const page = record(body.page);
    return [
      {
        project: text(body.project_id) ?? row.projectSlug ?? "unknown",
        provider: text(body.provider) ?? "unavailable",
        report: text(body.report) ?? row.dataset.slice("analytics/".length),
        availability: text(body.availability) ?? "unavailable",
        reason: text(body.reason),
        sourceTimezone: text(body.source_timezone) ?? row.timezone,
        grain: row.grain,
        status: row.status,
        dataAsOf: text(body.data_as_of) ?? row.dataAsOf,
        rows: Array.isArray(body.rows) ? body.rows.flatMap((item) => (record(item) ? [item as Record<string, unknown>] : [])) : [],
        completePropertyTotal: typeof page?.complete_property_total === "boolean" ? page.complete_property_total : null,
        limitations: stringList(body.limitations),
      },
    ];
  });
}

export function trafficPresentation(reports: TrafficReport[]): {
  combinedDistinctUsers: null;
  dailyUniqueSum: null;
  dimensionRowsAreTotals: false;
  dailyRows: { project: string; provider: string; report: string; row: Record<string, unknown> }[];
  periodHeadlines: TrafficReport[];
  dimensionReports: TrafficReport[];
} {
  return {
    combinedDistinctUsers: null,
    dailyUniqueSum: null,
    dimensionRowsAreTotals: false,
    dailyRows: reports
      .filter((report) => report.report === "ga4_overview_daily" || report.report === "vercel_daily")
      .flatMap((report) => report.rows.map((row) => ({ project: report.project, provider: report.provider, report: report.report, row }))),
    periodHeadlines: reports.filter((report) => report.report === "ga4_period_unique_users" || report.report === "gsc_daily_totals"),
    dimensionReports: reports.filter((report) => report.report === "gsc_dimension_rows" || report.report === "ga4_breakdown"),
  };
}

export function funnelDenominators(reports: TrafficReport[]): { app: string | null; web: string | null; unknown: string | null } {
  let app: string | null = null;
  let web: string | null = null;
  let unknown: string | null = null;
  for (const report of reports) {
    for (const row of report.rows) {
      if (app === null && (typeof row.app === "string" || typeof row.app === "number")) app = String(row.app);
      if (web === null && (typeof row.web === "string" || typeof row.web === "number")) web = String(row.web);
      if (unknown === null && "unknown_attribution" in row) {
        const value = row.unknown_attribution;
        unknown = value === null || value === undefined ? "unavailable" : String(value);
      }
    }
  }
  return { app, web, unknown };
}

export type CountField = { value: string | null; reason: string | null };

export type SubscriptionView =
  | { state: "missing" }
  | { state: "unsupported"; reason: string; warnings: string[] }
  | { state: "ready"; contracts: CountField; customers: CountField; paidAccess: CountField; mrr: MoneyMetric | null; warnings: string[] };

function countField(value: unknown): CountField {
  const row = record(value);
  if (!row) return { value: null, reason: null };
  const reason = text(row.reason);
  if (typeof row.value === "number" || typeof row.value === "string") return { value: String(row.value), reason };
  return { value: null, reason };
}

export function subscriptionView(body: unknown): SubscriptionView {
  const row = record(body);
  if (!row) return { state: "missing" };
  const warnings = stringList(row.warnings);
  if (row.supported === false) return { state: "unsupported", reason: text(row.reason) ?? "unsupported", warnings };
  if (row.supported !== true || !record(row.metrics)) return { state: "missing" };
  const metrics = record(row.metrics)!;
  return {
    state: "ready",
    contracts: countField(metrics.active_contracts),
    customers: countField(metrics.active_customers),
    paidAccess: countField(metrics.paid_access_accounts),
    mrr: readMetric(metrics.mrr),
    warnings,
  };
}

export type OperationRow = { date: string; name: string; count: string; additive: boolean };

export function operationRows(body: unknown): { flows: OperationRow[]; stocks: OperationRow[]; warnings: string[] } | null {
  const row = record(body);
  if (!row || !Array.isArray(row.buckets)) return null;
  const flows: OperationRow[] = [];
  const stocks: OperationRow[] = [];
  for (const item of row.buckets) {
    const bucket = record(item);
    if (!bucket || typeof bucket.date !== "string") continue;
    const read = (value: unknown, additive: boolean, target: OperationRow[]) => {
      if (!Array.isArray(value)) return;
      for (const entry of value) {
        const flow = record(entry);
        if (!flow || typeof flow.name !== "string") continue;
        const count = typeof flow.count === "number" || typeof flow.count === "string" ? String(flow.count) : null;
        if (count === null) continue;
        target.push({ date: bucket.date as string, name: flow.name, count, additive });
      }
    };
    read(bucket.flows, true, flows);
    read(bucket.stocks, false, stocks);
  }
  return { flows, stocks, warnings: stringList(row.warnings) };
}

export function filterLabeledRows<T extends { currency: string | null; source: string | null; status: string | null }>(
  rows: T[],
  filters: { currency: string | null; source: string | null; status: string | null },
): T[] {
  return rows.filter((row) => {
    if (filters.currency && row.currency !== filters.currency) return false;
    if (filters.source && row.source !== filters.source) return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  });
}
