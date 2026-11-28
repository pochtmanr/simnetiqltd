import { humanize, relativeTime } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import { describeDataset } from "@/lib/business-os/workspace/sources";
import {
  attentionItems,
  balancesVerified,
  readTrafficReports,
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

export type SourceState = {
  status: "not_connected" | "off" | "syncing" | "failing" | "synced";
  label: string;
  tone: "muted" | "info" | "bad" | "ok";
  lastSuccessAt: string | null;
};

/** Where a project's data source stands, in the words the dashboard shows. */
export function sourceStateFor(data: WorkspaceData, slug: string): SourceState {
  const connection = data.connections.find((row) => row.projectSlug === slug);
  if (!connection) return { status: "not_connected", label: "Not connected", tone: "muted", lastSuccessAt: null };
  if (!connection.enabled) return { status: "off", label: "Not switched on", tone: "muted", lastSuccessAt: null };
  const health = "error" in data.health ? undefined : data.health.rows.find((row) => row.connectionId === connection.id);
  const last = health?.lastSuccessAt ?? null;
  if (health && (health.status === "outage" || health.status === "degraded")) {
    return { status: "failing", label: last ? `Sync failing · last ${relativeTime(last)}` : "Sync failing", tone: "bad", lastSuccessAt: last };
  }
  if (!last) return { status: "syncing", label: "First sync running", tone: "info", lastSuccessAt: null };
  return { status: "synced", label: `Synced ${relativeTime(last)}`, tone: "ok", lastSuccessAt: last };
}

/** Projects whose source has delivered data at least once. */
export function connectedProjects(data: WorkspaceData): string[] {
  return data.projects.filter((project) => sourceStateFor(data, project.slug).lastSuccessAt !== null).map((project) => project.slug);
}

/**
 * Monthly users for one project: Google Analytics active users for the stored
 * period, which counts website visitors, not app users. Null when not imported.
 */
export function mauFor(data: WorkspaceData, slug: string): number | null {
  if ("error" in data.snapshots) return null;
  const report = readTrafficReports(data.snapshots.rows).find(
    (row) => row.project === slug && row.report === "ga4_period_unique_users" && row.availability === "available",
  );
  const value = report?.rows[0]?.active_users;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Monthly users across products. They are separate sites, so adding them does not double-count a visitor of one product. */
export function mauTotal(data: WorkspaceData): { value: number | null; counted: number } {
  const values = data.projects.map((project) => mauFor(data, project.slug)).filter((value): value is number => value !== null);
  return { value: values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null, counted: values.length };
}

export function attentionFor(data: WorkspaceData): string[] {
  const primary = primaryReport(data);
  const health = "error" in data.health ? [] : data.health.rows;
  const stale = "error" in data.snapshots ? [] : data.snapshots.rows.filter((row) => row.status === "stale").map((row) => describeDataset(row.dataset).label);
  const unmatched = primary.report?.buckets.reduce((sum, bucket) => sum + bucket.cash.residuals.length, 0) ?? 0;
  return attentionItems({
    coverage: primary.report?.coverage ?? null,
    exclusions: primary.report?.exclusions ?? [],
    connectedProjects: connectedProjects(data),
    health: health.map((row) => ({ status: row.status, lastErrorCode: row.lastErrorCode ? humanize(row.lastErrorCode).toLowerCase() : null })),
    staleDatasets: stale,
    unmatchedCount: unmatched,
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
