/**
 * Dataset descriptors. Every imported snapshot is keyed by a dataset name; a
 * descriptor says where it is shown and how to read it. A dataset with no
 * descriptor still renders through the generic table and is never summed, so a
 * new integration shows up on the Sources page before anyone writes UI for it.
 */

export type DatasetGroup = "finance" | "subscriptions" | "operations" | "audience" | "other";

export type DatasetDescriptor = {
  prefix: string;
  label: string;
  group: DatasetGroup;
  /** Workspace section that renders this dataset, when one exists. */
  section: string | null;
  /** Markdown shown next to the dataset. */
  notes: string;
};

const DATASETS: DatasetDescriptor[] = [
  { prefix: "finance/records", label: "Finance records", group: "finance", section: "sales", notes: "Ledger observations with revisions. Feeds **Sales** and every finance report." },
  { prefix: "finance/summary", label: "Finance summary", group: "finance", section: "reports", notes: "Source-side totals used to reconcile the statements." },
  { prefix: "finance/daily", label: "Finance daily", group: "finance", section: "reports", notes: "Daily source totals for reconciliation." },
  { prefix: "finance/balances", label: "Balances", group: "finance", section: "accounts", notes: "Point-in-time balances. **Not additive** across days or accounts." },
  { prefix: "finance/reconciliation", label: "Reconciliation", group: "finance", section: "accounts", notes: "Settlement matching. Unmatched rows appear under Cash & payouts." },
  { prefix: "subscriptions/summary", label: "Subscriptions", group: "subscriptions", section: "subscriptions", notes: "Recurring contracts, customers and MRR as reported by the source. An unsupported field stays unavailable, never zero." },
  { prefix: "operations/daily", label: "Operations", group: "operations", section: "subscriptions", notes: "Daily flows (additive) and stocks (not additive)." },
  { prefix: "analytics/", label: "Analytics", group: "audience", section: "traffic", notes: "Provider reports. Distinct users stay with their provider, grain and timezone." },
];

export function describeDataset(dataset: string): DatasetDescriptor {
  const known = DATASETS.find((item) => (item.prefix.endsWith("/") ? dataset.startsWith(item.prefix) : dataset === item.prefix));
  if (known) {
    if (known.prefix !== "analytics/") return known;
    return { ...known, label: `Analytics · ${dataset.slice("analytics/".length).replaceAll("_", " ")}` };
  }
  return {
    prefix: dataset,
    label: dataset.replaceAll("/", " · ").replaceAll("_", " "),
    group: "other",
    section: null,
    notes: "No dedicated view yet. Rows are shown as imported and are **never summed**.",
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/**
 * Flattens a snapshot body for display: its `rows` array when it has one,
 * otherwise its top-level fields as a single row. Values are strings, as imported.
 */
export function genericRows(body: unknown, limit = 200): { columns: string[]; rows: Record<string, string>[]; total: number } {
  const root = record(body);
  const source = Array.isArray(root?.rows) ? (root.rows as unknown[]) : Array.isArray(body) ? (body as unknown[]) : root ? [root] : [];
  const objects = source.flatMap((item) => (record(item) ? [record(item) as Record<string, unknown>] : []));
  const columns: string[] = [];
  for (const item of objects.slice(0, limit)) {
    for (const key of Object.keys(item)) {
      if (!columns.includes(key) && (source !== objects || key !== "rows")) columns.push(key);
    }
  }
  const rows = objects.slice(0, limit).map((item) => Object.fromEntries(columns.map((key) => [key, cell(item[key])])));
  return { columns: columns.filter((key) => key !== "rows"), rows, total: objects.length };
}

/** Keys that hold dates, identifiers or ratios; they never become a count series or headline. */
export const NOT_A_COUNT = /date|day|(^|_)id$|rate|ratio|percent|pct|share|position|ctr/i;

/** Numeric count columns of daily-style rows, for charting without a descriptor. */
export function numericKeys(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (NOT_A_COUNT.test(key)) continue;
      if (typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))) keys.add(key);
    }
  }
  return [...keys];
}

export function dateKey(rows: Record<string, unknown>[]): string | null {
  const first = rows[0];
  if (!first) return null;
  return Object.keys(first).find((key) => /^(date|day|period|period_start)$/i.test(key)) ?? null;
}
