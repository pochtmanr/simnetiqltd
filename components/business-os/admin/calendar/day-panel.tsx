"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CheckIcon, ExternalIcon, PlusIcon, TrashIcon } from "@/components/business-os/ui/icons";
import { Sheet } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink, StatusPill, cx } from "@/components/business-os/ui/primitives";
import { dayLong, dayShort, minutesOf, useNowMinutes } from "@/components/business-os/admin/calendar/clock";
import { SOURCE_LEGEND, STATUS_LEGEND, isSettled } from "@/components/business-os/admin/calendar/legend";
import { formatAmount } from "@/components/business-os/admin/calendar/money";
import { RepeatGlyph, SourceBadge, isTimed, itemData, toneStyle, type CalendarActions } from "@/components/business-os/admin/calendar/parts";
import { itemsOnDay } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

const ROW_PX = 36;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const hh = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function ItemCard({ item, actions }: { item: CalendarItem; actions: CalendarActions }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const amount = formatAmount(item.amount, item.currency, item.direction);
  const tab = SOURCE_LEGEND[item.source].tab;
  const canEdit = actions.canWrite && item.editable && Boolean(item.record);
  return (
    <article className="bos-cal-card" {...itemData(item)} style={toneStyle(item)}>
      <div className="bos-cal-card__top">
        <SourceBadge item={item} />
        <StatusPill tone={STATUS_LEGEND[item.status].tone} label={STATUS_LEGEND[item.status].label} compact />
      </div>
      <h3 className="bos-cal-card__title">
        {item.title}
        {item.repeat ? <RepeatGlyph /> : null}
      </h3>
      <p className="bos-caption bos-num">
        {item.start !== item.end ? `${dayShort(item.start)} to ${dayShort(item.end)}` : item.time ? `${item.time}${item.endTime ? `–${item.endTime}` : ""}` : "All day"}
        {item.repeat ? " · repeats" : ""}
      </p>
      {amount ? (
        <p className="bos-cal-card__amount bos-num" data-direction={item.direction ?? undefined}>
          {amount}
        </p>
      ) : null}
      <div className="bos-cal-card__actions">
        {item.href ? (
          <ButtonLink size="sm" variant="ghost" href={item.href}>
            <ExternalIcon size={14} />
            Open in {tab ?? "its tab"}
          </ButtonLink>
        ) : null}
        {canEdit ? (
          <>
            <Button size="sm" onClick={() => actions.editEvent(item)}>
              {item.repeat ? "Edit series" : "Edit"}
            </Button>
            {!item.repeat && !isSettled(item) ? (
              <Button size="sm" onClick={() => actions.markDone(item)}>
                <CheckIcon size={14} />
                Mark done
              </Button>
            ) : null}
            {confirming ? (
              <>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const ok = await actions.deleteEvent(item);
                    setBusy(false);
                    if (!ok) setConfirming(false);
                  }}
                >
                  {busy ? "Deleting…" : item.repeat ? "Delete the whole series" : "Delete event"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Keep
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={`Delete ${item.title}`}>
                <TrashIcon size={14} />
                Delete
              </Button>
            )}
          </>
        ) : null}
      </div>
    </article>
  );
}

function Timeline({ day, items, today, actions }: { day: string; items: CalendarItem[]; today: string; actions: CalendarActions }) {
  const now = useNowMinutes();
  const box = useRef<HTMLDivElement>(null);
  const byHour = new Map<number, CalendarItem[]>();
  for (const item of items) {
    const hour = Math.floor((minutesOf(item.time) ?? 0) / 60);
    byHour.set(hour, [...(byHour.get(hour) ?? []), item]);
  }
  const first = items.length ? Math.floor((minutesOf(items[0].time) ?? 480) / 60) : 8;

  useEffect(() => {
    const focusHour = day === today && now !== null ? Math.max(0, Math.floor(now / 60) - 1) : Math.max(0, first - 1);
    const row = box.current?.querySelector<HTMLElement>(`[data-hour="${focusHour}"]`);
    if (box.current && row) box.current.scrollTop = row.offsetTop;
    // Only on open: following the clock every minute would yank the list out from under the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  return (
    <div className="bos-cal-timeline" ref={box} style={{ "--cal-row": `${ROW_PX}px` } as CSSProperties}>
      {HOURS.map((hour) => {
        const inHour = byHour.get(hour) ?? [];
        const isNow = day === today && now !== null && Math.floor(now / 60) === hour;
        return (
          <div key={hour} className={cx("bos-cal-timeline__row", isNow && "is-now")} data-hour={hour}>
            <span className="bos-cal-timeline__label bos-num">{hh(hour)}</span>
            <div className="bos-cal-timeline__body">
              {inHour.length ? (
                inHour.map((item) => (
                  <ItemCard key={item.id} item={item} actions={actions} />
                ))
              ) : actions.canWrite ? (
                <button
                  type="button"
                  className="bos-cal-timeline__empty"
                  aria-label={`New event at ${hh(hour)}`}
                  onClick={() => actions.newEvent({ startsOn: day, endsOn: day, startTime: hh(hour), endTime: hour === 23 ? "23:59" : hh(hour + 1) })}
                >
                  <PlusIcon size={14} />
                </button>
              ) : null}
            </div>
            {isNow && now !== null ? <span className="bos-cal-now" style={{ top: `${((now % 60) / 60) * 100}%` }} aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function DayPanel({ day, items, today, actions, onClose }: { day: string | null; items: CalendarItem[]; today: string; actions: CalendarActions; onClose: () => void }) {
  const onDay = day ? itemsOnDay(items, day) : [];
  const allDay = onDay.filter((item) => !isTimed(item));
  const timed = onDay.filter(isTimed);
  return (
    <Sheet
      open={day !== null}
      onClose={onClose}
      title={day ? `${dayLong(day)}${day === today ? " · Today" : ""}` : ""}
      footer={
        day && actions.canWrite ? (
          <Button variant="primary" block onClick={() => actions.newEvent({ startsOn: day, endsOn: day })}>
            <PlusIcon size={16} />
            Add event on this day
          </Button>
        ) : null
      }
    >
      {day ? (
        <div className="bos-cal-panel">
          {onDay.length === 0 ? <p className="bos-caption">Nothing is dated on this day.</p> : null}
          {allDay.length ? (
            <section className="bos-cal-panel__group" aria-label="All day">
              <h3 className="bos-label">All day</h3>
              {allDay.map((item) => (
                <ItemCard key={item.id} item={item} actions={actions} />
              ))}
            </section>
          ) : null}
          <section className="bos-cal-panel__group" aria-label="By hour">
            <h3 className="bos-label">By hour</h3>
            <Timeline key={day} day={day} items={timed} today={today} actions={actions} />
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}
