import { entries, formatUnits, addTo, type Totals } from "@/components/business-os/admin/calendar/money";
import { overlaps } from "@/lib/business-os/calendar/dates";
import type { CalendarItem, CalendarWindow } from "@/lib/business-os/calendar/types";

const OUTFLOW_SOURCES = new Set(["expense_due", "recurring", "renewal", "service_due"]);

export type RangeSummary = { outflow: Totals; overdue: number; advertising: Totals; income: Totals; paid: Totals };

const open = (item: CalendarItem) => item.status !== "paid" && item.status !== "done" && item.status !== "cancelled";

/** Figures for the visible range; each currency stays its own total. */
export function summarize(items: CalendarItem[], range: CalendarWindow): RangeSummary {
  const summary: RangeSummary = { outflow: new Map(), overdue: 0, advertising: new Map(), income: new Map(), paid: new Map() };
  for (const item of items) {
    // Overdue counts everything still owed by the end of the view, not only what falls inside it.
    if (item.status === "overdue" && item.start <= range.to) summary.overdue += 1;
    if (!overlaps(item.start, item.end, range.from, range.to)) continue;
    if (item.source === "bank" || item.status === "cancelled") continue;
    const add = (totals: Totals) => addTo(totals, item.currency, item.amount);
    if (item.category === "advertising") add(summary.advertising);
    if (item.direction === "out" && open(item) && (OUTFLOW_SOURCES.has(item.source) || item.category === "bill" || item.category === "advertising")) add(summary.outflow);
    if (item.direction === "in" && open(item)) add(summary.income);
    if (item.direction === "out" && (item.status === "paid" || item.source === "expense_paid" || (item.source === "event" && item.status === "done"))) add(summary.paid);
  }
  return summary;
}

function Figure({ label, totals, tone }: { label: string; totals: Totals; tone?: "out" | "in" }) {
  const list = entries(totals);
  return (
    <div className="bos-cal-stat" data-tone={tone}>
      <dt>{label}</dt>
      <dd>
        {list.length === 0 ? (
          <span className="bos-cal-stat__none">None</span>
        ) : (
          list.map(([code, units]) => (
            <span key={code} className="bos-num">
              {formatUnits(units, code)}
            </span>
          ))
        )}
      </dd>
    </div>
  );
}

export function Summary({ items, range }: { items: CalendarItem[]; range: CalendarWindow }) {
  const summary = summarize(items, range);
  return (
    <dl className="bos-cal-summary" aria-label="This range">
      <Figure label="Due and planned out" totals={summary.outflow} tone="out" />
      <div className="bos-cal-stat" data-tone={summary.overdue ? "bad" : undefined}>
        <dt>Overdue</dt>
        <dd>
          <span className="bos-num">{summary.overdue}</span>
        </dd>
      </div>
      <Figure label="Advertising budget" totals={summary.advertising} />
      <Figure label="Expected in" totals={summary.income} tone="in" />
      <Figure label="Paid" totals={summary.paid} />
    </dl>
  );
}
