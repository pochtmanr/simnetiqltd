"use client";

import { CalendarIcon } from "@/components/business-os/ui/icons";
import { Button, EmptyState, StatusPill, cx } from "@/components/business-os/ui/primitives";
import { dayHead, dayShort } from "@/components/business-os/admin/calendar/clock";
import { STATUS_LEGEND } from "@/components/business-os/admin/calendar/legend";
import { addSigned, entries, formatUnits, type Totals } from "@/components/business-os/admin/calendar/money";
import { ItemText, SourceBadge, itemData, itemLabel, toneStyle, type CalendarActions } from "@/components/business-os/admin/calendar/parts";
import { AGENDA_DAYS, addDays, compareItems } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

/** Counts toward the running balance: still to happen, and not a bank line that already did. */
function isPlanned(item: CalendarItem): boolean {
  return (item.status === "planned" || item.status === "pending") && item.source !== "bank";
}

function Money({ totals, label }: { totals: Totals; label: string }) {
  const list = entries(totals).filter(([, units]) => units !== 0n);
  if (!list.length) return null;
  return (
    <span className="bos-cal-agenda__money">
      <span className="bos-caption">{label}</span>
      {list.map(([code, units]) => (
        <span key={code} className="bos-num" data-sign={units < 0n ? "out" : "in"}>
          {formatUnits(units, code, { signed: true })}
        </span>
      ))}
    </span>
  );
}

function Row({ item, actions, day }: { item: CalendarItem; actions: CalendarActions; day: string }) {
  return (
    <li>
      <button
        type="button"
        className="bos-cal-agenda__row"
        {...itemData(item)}
        style={toneStyle(item)}
        aria-label={itemLabel(item)}
        onClick={() => (item.editable && item.record ? actions.editEvent(item) : actions.openDay(day))}
      >
        <span className="bos-cal-agenda__time bos-num">{item.time ?? (item.start !== item.end ? `to ${dayShort(item.end)}` : "All day")}</span>
        <span className="bos-cal-agenda__main">
          <ItemText item={item} showTime={false} />
        </span>
        <SourceBadge item={item} />
        {item.status !== "planned" ? <StatusPill tone={STATUS_LEGEND[item.status].tone} label={STATUS_LEGEND[item.status].label} compact /> : null}
      </button>
    </li>
  );
}

export function Agenda({ anchor, items, today, actions }: { anchor: string; items: CalendarItem[]; today: string; actions: CalendarActions }) {
  const last = addDays(anchor, AGENDA_DAYS - 1);
  const overdue = items.filter((item) => item.status === "overdue").sort(compareItems);
  const upcoming = items.filter((item) => item.status !== "overdue" && item.end >= anchor && item.start <= last);
  // A bar that began before the anchor is listed on the anchor's day.
  const byDay = new Map<string, CalendarItem[]>();
  for (const item of upcoming) {
    const day = item.start < anchor ? anchor : item.start;
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  const days = [...byDay.keys()].sort();
  const running: Totals = new Map();

  if (!days.length && !overdue.length) {
    return (
      <EmptyState
        icon={<CalendarIcon />}
        title={`Nothing planned from ${dayShort(anchor)} to ${dayShort(last)}`}
        action={
          actions.canWrite ? (
            <Button variant="primary" onClick={() => actions.newEvent({ startsOn: anchor, endsOn: anchor })}>
              New event
            </Button>
          ) : null
        }
      >
        <p>Campaigns, bills, deadlines and meetings you add here appear alongside due expenses, renewals and recurring bills from the other tabs.</p>
      </EmptyState>
    );
  }

  return (
    <div className="bos-cal-agenda">
      {overdue.length ? (
        <section className="bos-cal-agenda__day is-overdue" aria-label="Overdue">
          <header className="bos-cal-agenda__head">
            <span className="bos-cal-agenda__date">
              <strong>Overdue</strong>
              <span className="bos-caption">{overdue.length === 1 ? "1 item" : `${overdue.length} items`}</span>
            </span>
          </header>
          <ul>
            {overdue.map((item) => (
              <Row key={item.id} item={item} actions={actions} day={item.start} />
            ))}
          </ul>
        </section>
      ) : null}
      {days.map((day) => {
        const list = (byDay.get(day) ?? []).sort(compareItems);
        const net: Totals = new Map();
        for (const item of list) {
          if (!isPlanned(item)) continue;
          addSigned(net, item);
          addSigned(running, item);
        }
        const balance: Totals = new Map(running);
        return (
          <section key={day} className={cx("bos-cal-agenda__day", day === today && "is-today")} aria-label={dayHead(day)}>
            <header className="bos-cal-agenda__head">
              <span className="bos-cal-agenda__date">
                <strong>
                  {dayHead(day)}
                  {day === today ? <span className="bos-cal-agenda__today"> · Today</span> : day === addDays(today, 1) ? <span className="bos-caption"> · Tomorrow</span> : null}
                </strong>
              </span>
              <Money totals={net} label="Day" />
              <Money totals={balance} label="Running" />
            </header>
            <ul>
              {list.map((item) => (
                <Row key={item.id} item={item} actions={actions} day={day} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
