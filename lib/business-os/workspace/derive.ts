import { humanize } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import { describeDataset } from "@/lib/business-os/workspace/sources";
import {
  attentionItems,
  balancesVerified,
  type FinancialReportView,
  type MoneyMetric,
  type ReportBucket,
} from "@/lib/business-os/workspace/present";

export function primaryReport(data: WorkspaceData): { report: FinancialReportView | null; error: string | null } {
  if (data.company.report || data.company.error) return data.company;
  return data.byProject[0] ?? { report: null, error: null };
}

export function verifiedFor(data: WorkspaceData, basis: string): boolean {
  if ("error" in data.gates) return false;
  return balancesVerified(data.gates.rows, basis);
}

export function attentionFor(data: WorkspaceData): string[] {
  const primary = primaryReport(data);
  const health = "error" in data.health ? [] : data.health.rows;
  const stale = "error" in data.snapshots ? [] : data.snapshots.rows.filter((row) => row.status === "stale").map((row) => describeDataset(row.dataset).label);
  const unmatched = primary.report?.buckets.reduce((sum, bucket) => sum + bucket.cash.residuals.length, 0) ?? 0;
  const unverified = "error" in data.gates ? 0 : data.gates.rows.filter((gate) => gate.state !== "verified").length;
  return attentionItems({
    coverage: primary.report?.coverage ?? null,
    exclusions: primary.report?.exclusions ?? [],
    health: health.map((row) => ({ status: row.status, lastErrorCode: row.lastErrorCode ? humanize(row.lastErrorCode).toLowerCase() : null })),
    staleDatasets: stale,
    unmatchedCount: unmatched,
    unverifiedGates: unverified,
  });
}

/** Headline metrics for one bucket: GBP when converted, else the only native currency. */
export function headlineMetrics(bucket: ReportBucket | null | undefined): { metrics: Record<string, MoneyMetric | null> | null; limit: string | null } {
  if (!bucket) return { metrics: null, limit: null };
  if (bucket.gbp.metrics) return { metrics: bucket.gbp.metrics, limit: null };
  if (bucket.native.length === 1) return { metrics: bucket.native[0]?.metrics ?? null, limit: null };
  if (bucket.native.length > 1) return { metrics: null, limit: "Several native currencies" };
  return { metrics: null, limit: bucket.gbp.reason };
}

/** True when any source connection is not healthy, or health could not be read. */
export function sourcesNeedAttention(data: WorkspaceData): boolean {
  if ("error" in data.health) return data.connections.length > 0;
  return data.health.rows.some((row) => row.status !== "ok");
}
