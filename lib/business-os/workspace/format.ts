import { londonDate, londonWallToUtc } from "@/lib/business-os/finance/london";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";

const SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€", ILS: "₪", JPY: "¥", AUD: "A$", CAD: "C$" };

/** Thousands-separated decimal string without going through floats, so ledger strings stay exact. */
export function groupDigits(amount: string): string {
  const negative = amount.startsWith("-");
  const bare = negative ? amount.slice(1) : amount;
  const [whole = "0", fraction] = bare.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}${grouped}${fraction !== undefined ? `.${fraction}` : ""}`;
}

/** "£1,240.00", "−$3.00", "1,000.00 XYZ"; null amount reads "Unavailable", never zero. */
export function formatMoney(amount: string | null, currency: string | null): string {
  if (amount === null) return "Unavailable";
  const grouped = groupDigits(amount);
  if (!currency) return grouped;
  const symbol = SYMBOLS[currency];
  if (!symbol) return `${grouped} ${currency}`;
  return grouped.startsWith("−") ? `−${symbol}${grouped.slice(1)}` : `${symbol}${grouped}`;
}

export function isNegative(amount: string | null): boolean {
  return amount !== null && amount.trim().startsWith("-") && Number(amount) !== 0;
}

/** Chart-only numeric value. Ledger figures stay strings everywhere else. */
export function chartNumber(amount: string | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? value : null;
}

export function compactMoney(value: number, currency: string | null): string {
  const symbol = currency ? (SYMBOLS[currency] ?? "") : "";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const body = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}m` : abs >= 1_000 ? `${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k` : abs.toFixed(0);
  return `${sign}${symbol}${body}`;
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  const spaced = value.replaceAll("_", " ").replaceAll("/", " / ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
const DATE_SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" });
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/London",
});
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" });
const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Europe/London" });

function valid(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined, fallback = "—"): string {
  const date = valid(iso);
  return date ? DATE.format(date) : fallback;
}

export function formatShortDate(iso: string | null | undefined): string {
  const date = valid(iso);
  return date ? DATE_SHORT.format(date) : "—";
}

export function formatDateTime(iso: string | null | undefined, fallback = "—"): string {
  const date = valid(iso);
  return date ? DATE_TIME.format(date) : fallback;
}

export function formatMonth(iso: string | null | undefined): string {
  const date = valid(iso);
  return date ? MONTH_SHORT.format(date) : "";
}

export function relativeTime(iso: string | null | undefined, now = new Date()): string {
  const date = valid(iso);
  if (!date) return "never";
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function anchorParts(anchor: string): { year: number; month: number } {
  return { year: Number(anchor.slice(0, 4)), month: Number(anchor.slice(5, 7)) };
}

/** The last instant inside a window is `to` minus a millisecond; windows are half-open. */
function lastDay(to: string): string {
  return londonDate(new Date(new Date(to).getTime() - 1));
}

export function periodLabel(query: Pick<WorkspaceQuery, "grain" | "anchor" | "from" | "to">): string {
  if (query.grain === "year") return query.anchor.slice(0, 4);
  if (query.grain === "month") {
    const { year, month } = anchorParts(query.anchor);
    return MONTH.format(new Date(Date.UTC(year, month - 1, 15, 12)));
  }
  return `${formatDate(londonDate(new Date(query.from)))} – ${formatDate(lastDay(query.to))}`;
}

export function windowDates(query: Pick<WorkspaceQuery, "from" | "to">): { from: string; to: string } {
  return { from: londonDate(new Date(query.from)), to: lastDay(query.to) };
}

/** Patch that moves a month/year period one step; custom ranges shift by their own length. */
export function shiftPeriod(query: WorkspaceQuery, direction: -1 | 1): Partial<WorkspaceQuery> {
  const { year, month } = anchorParts(query.anchor);
  if (query.grain === "year") return { anchor: `${year + direction}-01-01` };
  if (query.grain === "month") {
    const index = year * 12 + (month - 1) + direction;
    const nextYear = Math.floor(index / 12);
    const nextMonth = (index % 12) + 1;
    return { anchor: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01` };
  }
  // Custom ranges move by their own length in whole London days, so clock changes never shift the edges.
  const days = windowDates(query);
  const dayIndex = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) / 86_400_000;
  const toDayString = (index: number) => new Date(index * 86_400_000).toISOString().slice(0, 10);
  const start = dayIndex(days.from);
  const end = dayIndex(days.to);
  const span = (end - start + 1) * direction;
  return customWindow(toDayString(start + span), toDayString(end + span));
}

/** Converts London calendar days (inclusive) into the half-open UTC window the query expects. */
export function customWindow(fromDay: string, toDay: string): { from: string; to: string } {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  const end = new Date(Date.UTC(ty, tm - 1, td + 1, 12));
  return {
    from: londonWallToUtc(fy, fm, fd).toISOString(),
    to: londonWallToUtc(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()).toISOString(),
  };
}

export type PeriodPreset = { id: string; label: string; patch: Partial<WorkspaceQuery> };

export function periodPresets(now = new Date()): PeriodPreset[] {
  const today = londonDate(now);
  const { year, month } = anchorParts(today);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const quarterStart = Math.floor((month - 1) / 3) * 3 + 1;
  const thirtyAgo = londonDate(new Date(now.getTime() - 29 * 86_400_000));
  const twelveStart = month === 12 ? `${year}-01-01` : `${year - 1}-${String(month + 1).padStart(2, "0")}-01`;
  const pad = (value: number) => String(value).padStart(2, "0");
  const custom = (from: string, to: string): Partial<WorkspaceQuery> => ({ grain: "custom", ...customWindow(from, to) });
  return [
    { id: "this_month", label: "This month", patch: { grain: "month", anchor: `${year}-${pad(month)}-01` } },
    { id: "last_month", label: "Last month", patch: { grain: "month", anchor: `${prev.year}-${pad(prev.month)}-01` } },
    { id: "qtd", label: "Quarter to date", patch: custom(`${year}-${pad(quarterStart)}-01`, today) },
    { id: "ytd", label: "Year to date", patch: custom(`${year}-01-01`, today) },
    { id: "last_30", label: "Last 30 days", patch: custom(thirtyAgo, today) },
    { id: "last_12", label: "Last 12 months", patch: custom(twelveStart, today) },
    { id: "this_year", label: "This year", patch: { grain: "year", anchor: `${year}-01-01` } },
  ];
}

export const BASIS_LABELS: Record<string, { label: string; hint: string }> = {
  purchase: { label: "Purchased", hint: "Count a sale when the customer pays." },
  earned_management: { label: "Earned", hint: "Spread a sale over the service period it pays for." },
  settled_cash: { label: "Paid out", hint: "Count money when the store or processor settles it." },
  sms_legacy: { label: "SMS legacy", hint: "Frozen SMS Code formula, kept for comparison." },
};

export const METRIC_LABELS: Record<string, string> = {
  gross_customer_sales: "Sales",
  refunded_principal: "Refunds",
  sales_tax: "Sales tax",
  store_and_processor_fees: "Fees",
  net_sales: "Net sales",
  net_proceeds: "Net proceeds",
  direct_costs: "Direct costs",
  contribution_profit: "Contribution",
  operating_expenses: "Operating expenses",
  operating_profit: "Operating profit",
  net_profit: "Net profit",
};
