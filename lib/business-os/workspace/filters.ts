import { londonDate, londonWallToUtc, londonWindow } from "@/lib/business-os/finance/london";

export const BASES = ["purchase", "earned_management", "settled_cash", "sms_legacy"] as const;
export const GRAINS = ["custom", "month", "year"] as const;
export const METRICS = [
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
] as const;

export type Basis = (typeof BASES)[number];
export type Grain = (typeof GRAINS)[number];
export type MetricName = (typeof METRICS)[number];
export type Surface = "admin" | "tg";

const ADMIN_SECTIONS = [
  "overview",
  "projects",
  "sales",
  "expenses",
  "subscriptions",
  "traffic",
  "accounts",
  "reports",
  "integrations",
  "settings",
  "documents",
  "records",
  "timeline",
] as const;

const TG_SECTIONS = [
  "overview",
  "money",
  "add",
  "documents",
  "more",
  "projects",
  "sales",
  "expenses",
  "subscriptions",
  "traffic",
  "accounts",
  "reports",
  "integrations",
  "timeline",
  "records",
  "settings",
] as const;

export type WorkspaceQuery = {
  section: string;
  grain: Grain;
  basis: Basis;
  anchor: string;
  from: string;
  to: string;
  project: string | null;
  currency: string | null;
  source: string | null;
  status: string | null;
  metric: MetricName | null;
};

function one(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function member(value: string | undefined, allowed: readonly string[]): string | null {
  return value && allowed.includes(value) ? value : null;
}

export function parseWorkspaceQuery(
  params: Record<string, string | string[] | undefined>,
  surface: Surface,
  now = new Date(),
): WorkspaceQuery {
  const grain = (member(one(params, "grain"), GRAINS) ?? "month") as Grain;
  const basis = (member(one(params, "basis"), BASES) ?? "purchase") as Basis;
  const anchorRaw = one(params, "anchor");
  const anchor = anchorRaw && /^\d{4}-\d{2}-\d{2}$/.test(anchorRaw) ? anchorRaw : londonDate(now);
  let from: string;
  let to: string;
  if (grain === "custom") {
    const rawFrom = one(params, "from");
    const rawTo = one(params, "to");
    const start = rawFrom ? Date.parse(rawFrom) : Number.NaN;
    const end = rawTo ? Date.parse(rawTo) : Number.NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      from = new Date(start).toISOString();
      to = new Date(end).toISOString();
    } else {
      const window = londonWindow("month", now);
      from = window.from;
      to = window.to;
    }
  } else {
    const year = Number(anchor.slice(0, 4));
    const month = Number(anchor.slice(5, 7));
    const day = Number(anchor.slice(8, 10));
    const window = londonWindow(grain, londonWallToUtc(year, month, day, 12));
    from = window.from;
    to = window.to;
  }
  const allowed = surface === "tg" ? TG_SECTIONS : ADMIN_SECTIONS;
  const requested = one(params, "section");
  const currencyRaw = one(params, "currency")?.toUpperCase();
  const source = one(params, "source")?.trim();
  const status = one(params, "status")?.trim();
  return {
    section: member(requested, allowed) ?? "overview",
    grain,
    basis,
    anchor,
    from,
    to,
    project: one(params, "project")?.trim() || null,
    currency: currencyRaw && /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : null,
    source: source ? source.slice(0, 80) : null,
    status: status ? status.slice(0, 40) : null,
    metric: member(one(params, "metric"), METRICS) as MetricName | null,
  };
}

export function workspaceHref(base: "/admin" | "/tg", query: WorkspaceQuery, patch: Partial<WorkspaceQuery> = {}): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  params.set("section", next.section);
  params.set("grain", next.grain);
  params.set("basis", next.basis);
  params.set("anchor", next.anchor);
  if (next.grain === "custom") {
    params.set("from", next.from);
    params.set("to", next.to);
  }
  if (next.project) params.set("project", next.project);
  if (next.currency) params.set("currency", next.currency);
  if (next.source) params.set("source", next.source);
  if (next.status) params.set("status", next.status);
  if (next.metric) params.set("metric", next.metric);
  return `${base}?${params.toString()}`;
}

export function csvHref(query: WorkspaceQuery): string {
  const params = new URLSearchParams();
  params.set("from", query.from);
  params.set("to", query.to);
  params.set("basis", query.basis);
  params.set("grain", query.grain);
  if (query.project) params.set("project", query.project);
  if (query.currency) params.set("currency", query.currency);
  return `/api/business-os/finance/exports/csv?${params.toString()}`;
}

export function telegramBack(query: WorkspaceQuery): string | null {
  if (query.section === "overview") return null;
  const parent = ["projects", "traffic", "timeline", "records", "settings"].includes(query.section)
    ? "more"
    : ["sales", "expenses", "accounts", "reports", "subscriptions", "integrations"].includes(query.section)
      ? "money"
      : "overview";
  return workspaceHref("/tg", query, { section: parent, metric: null });
}
