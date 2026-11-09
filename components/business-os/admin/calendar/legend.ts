import type { CalendarCategory, CalendarItem, CalendarSource, CalendarStatus } from "@/lib/business-os/calendar/types";
import type { Tone } from "@/components/business-os/ui/primitives";

/** How a kind of calendar item is named, coloured and abbreviated. Colours are token references only. */
export type LegendEntry = { label: string; color: string; glyph: string };

export const CATEGORY_LEGEND: Record<CalendarCategory, LegendEntry> = {
  advertising: { label: "Advertising", color: "var(--bos-series-4)", glyph: "Ad" },
  bill: { label: "Bills & payments", color: "var(--bos-series-3)", glyph: "Pay" },
  deadline: { label: "Deadline", color: "var(--bos-series-5)", glyph: "Due" },
  meeting: { label: "Meeting / task", color: "var(--bos-series-2)", glyph: "Mtg" },
};

/*
 * Categories take the plain series hues so they stand out most. Sources that would
 * share a hue get a mix instead: the money ones lean on the bills amber (orange
 * when due, olive when recurring), the rest are greyed versions of a series hue.
 */
export const SOURCE_LEGEND: Record<CalendarSource, LegendEntry & { tab: string | null }> = {
  event: { label: "Calendar event", color: "var(--bos-accent)", glyph: "Ev", tab: null },
  expense_due: { label: "Expense due", color: "color-mix(in srgb, var(--bos-series-3) 50%, var(--bos-bad))", glyph: "Exp", tab: "Expenses" },
  expense_paid: { label: "Expense paid", color: "var(--bos-muted)", glyph: "Paid", tab: "Expenses" },
  income: { label: "Income", color: "var(--bos-ok)", glyph: "In", tab: "Expenses" },
  recurring: { label: "Recurring bill", color: "color-mix(in srgb, var(--bos-series-3) 50%, var(--bos-ok))", glyph: "Rep", tab: "Subscriptions" },
  renewal: { label: "Renewal", color: "var(--bos-series-1)", glyph: "Ren", tab: "Registrations" },
  service_due: { label: "Service due", color: "color-mix(in srgb, var(--bos-series-1) 45%, var(--bos-muted))", glyph: "Svc", tab: "Registrations" },
  document: { label: "Document", color: "var(--bos-series-6)", glyph: "Doc", tab: "Files" },
  note: { label: "Note", color: "color-mix(in srgb, var(--bos-series-4) 45%, var(--bos-muted))", glyph: "Note", tab: "Notes" },
  bank: { label: "Bank", color: "var(--bos-info)", glyph: "Bank", tab: "Bank" },
  legacy: { label: "Older event", color: "var(--bos-muted)", glyph: "Old", tab: null },
};

/** Items with a category are tinted by it; everything else by where it came from. */
export function legendFor(item: Pick<CalendarItem, "category" | "source">): LegendEntry {
  return item.category ? CATEGORY_LEGEND[item.category] : SOURCE_LEGEND[item.source];
}

export const STATUS_LEGEND: Record<CalendarStatus, { label: string; tone: Tone }> = {
  planned: { label: "Planned", tone: "info" },
  pending: { label: "Pending", tone: "warn" },
  overdue: { label: "Overdue", tone: "bad" },
  done: { label: "Done", tone: "ok" },
  paid: { label: "Paid", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

/** Faded and struck through in every view. */
export function isSettled(item: Pick<CalendarItem, "status">): boolean {
  return item.status === "done" || item.status === "cancelled";
}

/** Filter key used by the chips: events filter by category, everything else by source. */
export function filterKey(item: Pick<CalendarItem, "category" | "source">): string {
  return item.category ? `category:${item.category}` : `source:${item.source}`;
}
