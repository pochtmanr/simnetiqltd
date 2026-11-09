"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cx } from "@/components/business-os/ui/primitives";
import { dayHead, dayLong, minutesOf, useNowMinutes } from "@/components/business-os/admin/calendar/clock";
import { Bar, ItemText, SourceBadge, isTimed, itemData, itemLabel, toneStyle, type CalendarActions } from "@/components/business-os/admin/calendar/parts";
import { itemsOnDay, layoutWeekBars, overflowByDay, weekDays } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

const HOUR_PX = 44;
const FIRST_VISIBLE_HOUR = 7;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const ALL_DAY_LANES = 4;
/** Blocks shorter than two lines of text put the time and title on one line. */
const COMPACT_PX = 38;

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

type Placed = { item: CalendarItem; top: number; height: number; column: number; columns: number };

/** Positions a day's timed items; overlapping ones share the width in columns. */
function placeTimed(items: CalendarItem[]): Placed[] {
  const spans = items
    .map((item) => {
      const start = minutesOf(item.time) ?? 0;
      const end = Math.max(start + 30, minutesOf(item.endTime) ?? start + 60);
      return { item, start, end: Math.min(end, 24 * 60) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: Placed[] = [];
  let cluster: (Placed & { end: number })[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const columns = Math.max(1, ...cluster.map((entry) => entry.column + 1));
    for (const entry of cluster) placed.push({ ...entry, columns });
    cluster = [];
  };
  for (const span of spans) {
    if (span.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const taken = new Set(cluster.filter((entry) => entry.end > span.start).map((entry) => entry.column));
    let column = 0;
    while (taken.has(column)) column += 1;
    cluster.push({ item: span.item, top: (span.start / 60) * HOUR_PX, height: Math.max(22, ((span.end - span.start) / 60) * HOUR_PX), column, columns: 1, end: span.end });
    clusterEnd = Math.max(clusterEnd, span.end);
  }
  flush();
  return placed;
}

export function WeekView({ anchor, items, today, actions }: { anchor: string; items: CalendarItem[]; today: string; actions: CalendarActions }) {
  const days = weekDays(anchor);
  const allDay = items.filter((item) => !isTimed(item));
  const laid = layoutWeekBars(allDay, days[0]);
  const bars = laid.filter((bar) => bar.lane < ALL_DAY_LANES);
  const hidden = overflowByDay(laid, ALL_DAY_LANES);
  const lanes = Math.max(1, ...bars.map((bar) => bar.lane + 1)) + (hidden.some(Boolean) ? 1 : 0);
  const now = useNowMinutes();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = FIRST_VISIBLE_HOUR * HOUR_PX;
  }, []);

  const open = (item: CalendarItem) => (item.editable && item.record ? actions.editEvent(item) : actions.openDay(item.start));

  return (
    <>
      <div className="bos-cal-weekgrid" style={{ "--cal-hour": `${HOUR_PX}px` } as CSSProperties}>
        <div className="bos-cal-weekgrid__head">
          <span className="bos-cal-gutter" />
          {days.map((day) => (
            <button key={day} type="button" className={cx("bos-cal-colhead", day === today && "is-today", day < today && "is-past")} onClick={() => actions.openDay(day)} aria-label={`Open ${dayLong(day)}`}>
              <span>{dayHead(day).split(" ")[0]}</span>
              <span className="bos-cal-colhead__num">{Number(day.slice(8, 10))}</span>
            </button>
          ))}
        </div>
        <div className="bos-cal-allday">
          <span className="bos-cal-gutter bos-caption">All day</span>
          <div className="bos-cal-allday__bars" style={{ gridTemplateRows: `repeat(${lanes}, 22px)` }}>
            {bars.map((bar) => (
              <Bar key={bar.item.id} bar={bar} onClick={open} />
            ))}
            {hidden.map((count, index) =>
              count > 0 ? (
                <button
                  key={`more-${index}`}
                  type="button"
                  className="bos-cal-more"
                  style={{ gridColumn: index + 1, gridRow: ALL_DAY_LANES + 1 }}
                  onClick={() => actions.openDay(days[index])}
                  aria-label={`${count} more on ${dayLong(days[index])}`}
                >
                  +{count} more
                </button>
              ) : null,
            )}
          </div>
        </div>
        <div className="bos-cal-hours" ref={scroller}>
          <div className="bos-cal-hours__inner">
            <div className="bos-cal-gutter bos-cal-hours__labels" aria-hidden>
              {HOURS.map((hour) => (
                <span key={hour} style={{ top: hour * HOUR_PX }}>
                  {hour === 0 ? "" : hhmm(hour * 60)}
                </span>
              ))}
            </div>
            {days.map((day) => {
              const timed = placeTimed(itemsOnDay(items, day).filter(isTimed));
              return (
                <div key={day} className={cx("bos-cal-hours__col", day === today && "is-today", day < today && "is-past")}>
                  {actions.canWrite
                    ? HOURS.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          tabIndex={-1}
                          className="bos-cal-slot"
                          style={{ top: hour * HOUR_PX }}
                          aria-label={`New event ${dayLong(day)} at ${hhmm(hour * 60)}`}
                          onClick={() => actions.newEvent({ startsOn: day, endsOn: day, startTime: hhmm(hour * 60), endTime: hhmm(Math.min(hour * 60 + 60, 23 * 60 + 59)) })}
                        />
                      ))
                    : null}
                  {timed.map((entry) => (
                    <button
                      key={entry.item.id}
                      type="button"
                      className="bos-cal-timed"
                      {...itemData(entry.item)}
                      data-compact={entry.height < COMPACT_PX ? "" : undefined}
                      style={{
                        ...toneStyle(entry.item),
                        top: entry.top,
                        height: entry.height,
                        left: `calc(${(entry.column / entry.columns) * 100}% + 2px)`,
                        width: `calc(${100 / entry.columns}% - 4px)`,
                      }}
                      aria-label={itemLabel(entry.item)}
                      title={itemLabel(entry.item)}
                      onClick={() => open(entry.item)}
                    >
                      <ItemText item={entry.item} />
                    </button>
                  ))}
                  {day === today && now !== null ? <span className="bos-cal-now" style={{ top: (now / 60) * HOUR_PX }} aria-hidden /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ol className="bos-cal-daylist" aria-label="Week">
        {days.map((day) => {
          const onDay = itemsOnDay(items, day);
          return (
            <li key={day}>
              <button type="button" className={cx("bos-cal-daylist__day", day === today && "is-today")} onClick={() => actions.openDay(day)} aria-label={`Open ${dayLong(day)}`}>
                <span className="bos-cal-daylist__date">
                  <span>{dayHead(day).split(" ")[0]}</span>
                  <strong>{Number(day.slice(8, 10))}</strong>
                </span>
                <span className="bos-cal-daylist__items">
                  {onDay.length === 0 ? <span className="bos-caption">Nothing planned</span> : null}
                  {onDay.map((item) => (
                    <span key={item.id} className="bos-cal-chipline" {...itemData(item)} style={toneStyle(item)}>
                      <SourceBadge item={item} />
                      <ItemText item={item} />
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
