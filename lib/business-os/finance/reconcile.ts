const BASES = new Set(["purchase", "earned_management", "settled_cash", "sms_legacy"]);
const GRAINS = new Set(["custom", "month", "year"]);
const METRICS = new Set([
  "gross_customer_sales",
  "refunded_principal",
  "sales_tax",
  "store_and_processor_fees",
  "net_sales",
  "net_proceeds",
  "direct_costs",
  "contribution_profit",
  "operating_expenses",
  "operating_profit",
  "net_profit",
]);

export function reportQuery(params: URLSearchParams): { error: "invalid_body" } | Record<string, string | null> {
  const basis = params.get("basis");
  const grain = params.get("grain");
  const from = params.get("from");
  const to = params.get("to");
  const project = params.get("project");
  if (!basis || !BASES.has(basis) || !grain || !GRAINS.has(grain) || !from || !to) return { error: "invalid_body" };
  return {
    project_slug: project,
    from,
    to,
    basis,
    grain,
  };
}

export function drillQuery(params: URLSearchParams): { error: "invalid_body" } | Record<string, string | null> {
  const basis = params.get("basis");
  const from = params.get("from");
  const to = params.get("to");
  const metric = params.get("metric");
  const project = params.get("project");
  if (!basis || !BASES.has(basis) || !from || !to || !metric || !METRICS.has(metric)) return { error: "invalid_body" };
  return { project_slug: project, from, to, basis, metric };
}

export function evidenceKind(value: unknown): { kind: "synthetic" | "redacted_real" } | { error: "live_evidence_unavailable" | "invalid_body" } {
  if (value === undefined || value === null || value === "synthetic") return { kind: "synthetic" };
  if (value === "redacted_real") return { kind: "redacted_real" };
  if (value === "live") return { error: "live_evidence_unavailable" };
  return { error: "invalid_body" };
}
