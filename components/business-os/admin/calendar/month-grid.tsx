"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cx } from "@/components/business-os/ui/primitives";
import { dayLong } from "@/components/business-os/admin/calendar/clock";
import { legendFor } from "@/components/business-os/admin/calendar/legend";
import { addSigned, entries, formatUnits, type Totals } from "@/components/business-os/admin/calendar/money";
import { Bar, MAX_LANES, isMovable, type CalendarActions } from "@/components/business-os/admin/calendar/parts";
import { addDays, diffDays, itemsOnDay, layoutWeekBars, monthGrid, overflowByDay } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Pixels a press has to travel before it counts as a drag rather than a click. */
const DRAG_SLOP = 4;
const MOBILE_DOTS = 4;

type Press =
  | { kind: "range"; from: string; x: number; y: number; dragging: boolean }
  | { kind: "move"; item: CalendarItem; origin: string; x: number; y: number; dragging: boolean };

type Drag = { kind: "range"; from: string; to: string } | { kind: "move"; item: CalendarItem; origin: string; over: string } | null;

/** The day cell under a point, looking through any bar drawn on top of it. */
function dayAt(x: number, y: number): string | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const day = element instanceof HTMLElement ? element.closest<HTMLElement>("[data-day]")?.dataset.day : undefined;
    if (day) return day;
  }
  return null;
}

/** Net of everything with an amount that starts on the day, per currency; settled bank lines are left out. */
function dayNet(items: CalendarItem[], day: string): Totals {
  const totals: Totals = new Map();
  for (const item of items) {
    if (item.start !== day || item.source === "bank" || item.status === "cancelled") continue;
    addSigned(totals, item);
  }
  return totals;
}

export function MonthGrid({
  anchor,
  items,
  today,
  flashKey,
  actions,
}: {
  anchor: string;
  items: CalendarItem[];
  today: string;
  flashKey: number;
  actions: CalendarActions;
}) {
  const days = monthGrid(anchor);
  const month = anchor.slice(0, 7);
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const [drag, setDrag] = useState<Drag>(null);
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);
  /** Removes the window listeners of the press in progress. */
  const stopPress = useRef<(() => void) | null>(null);
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && drag) {
        stopPress.current?.();
        press.current = null;
        setDrag(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drag]);

  useEffect(() => () => stopPress.current?.(), []);

  function startPress(event: ReactPointerEvent, next: Press) {
    // Touch scrolls the page; drag gestures are for mouse and pen.
    if (event.button !== 0 || event.pointerType === "touch") return;
    stopPress.current?.();
    press.current = next;
    const onMove = (move: PointerEvent) => {
      const current = press.current;
      if (!current) return;
      if (!current.dragging && Math.hypot(move.clientX - current.x, move.clientY - current.y) < DRAG_SLOP) return;
      current.dragging = true;
      const over = dayAt(move.clientX, move.clientY);
      if (!over) return;
      setDrag(current.kind === "range" ? { kind: "range", from: current.from, to: over } : { kind: "move", item: current.item, origin: current.origin, over });
    };
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (stopPress.current === stop) stopPress.current = null;
    };
    const onUp = (up: PointerEvent) => {
      stop();
      const current = press.current;
      press.current = null;
      if (!current?.dragging || up.type === "pointercancel") {
        if (current?.kind === "move") setDrag(null);
        return;
      }
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      const over = dayAt(up.clientX, up.clientY);
      if (current.kind === "move") {
        setDrag(null);
        const delta = over ? diffDays(current.origin, over) : 0;
        if (delta !== 0) actionsRef.current.moveEvent(current.item, delta);
        return;
      }
      const to = over ?? current.from;
      const [startsOn, endsOn] = current.from <= to ? [current.from, to] : [to, current.from];
      if (startsOn === endsOn) {
        setDrag(null);
        actionsRef.current.openDay(startsOn);
        return;
      }
      if (actionsRef.current.canWrite) {
        setDrag(null);
        actionsRef.current.newEvent({ startsOn, endsOn });
      } else {
        setDrag({ kind: "range", from: startsOn, to: endsOn });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    stopPress.current = stop;
  }

  const selected = drag?.kind === "range" ? (drag.from <= drag.to ? [drag.from, drag.to] : [drag.to, drag.from]) : null;
  const dropDelta = drag?.kind === "move" ? diffDays(drag.origin, drag.over) : 0;
  const dropRange = drag?.kind === "move" ? [addDays(drag.item.start, dropDelta), addDays(drag.item.end, dropDelta)] : null;

  function onCellClick(day: string) {
    if (suppressClick.current) return;
    if (selected && (day < selected[0] || day > selected[1])) {
      setDrag(null);
      return;
    }
    actions.openDay(day);
  }

  function onBarClick(item: CalendarItem, day: string) {
    if (suppressClick.current) return;
    if (item.editable && item.record) actions.editEvent(item);
    else actions.openDay(day);
  }

  return (
    <div className="bos-cal-month">
      <div className="bos-cal-weekdays" aria-hidden>
        {WEEKDAYS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={cx("bos-cal-grid", drag && "is-dragging")} role="group" aria-label="Month">
        {weeks.map((week) => {
          const bars = layoutWeekBars(items, week[0]);
          const hidden = overflowByDay(bars, MAX_LANES);
          return (
            <div className="bos-cal-week" key={week[0]}>
              {week.map((day) => {
                const onDay = itemsOnDay(items, day);
                const net = entries(dayNet(items, day));
                const classes = cx(
                  "bos-cal-day",
                  day < today && "is-past",
                  day === today && "is-today",
                  day.slice(0, 7) !== month && "is-outside",
                  selected && day >= selected[0] && day <= selected[1] && "is-selected",
                  dropRange && day >= dropRange[0] && day <= dropRange[1] && "is-drop",
                );
                return (
                  <button
                    key={day}
                    type="button"
                    className={classes}
                    data-day={day}
                    aria-current={day === today ? "date" : undefined}
                    aria-label={`${dayLong(day)}, ${onDay.length === 0 ? "nothing planned" : onDay.length === 1 ? "1 item" : `${onDay.length} items`}`}
                    onPointerDown={(event) => startPress(event, { kind: "range", from: day, x: event.clientX, y: event.clientY, dragging: false })}
                    onClick={() => onCellClick(day)}
                  >
                    {day === today && flashKey > 0 ? <span className="bos-cal-flash" key={flashKey} aria-hidden /> : null}
                    <span className="bos-cal-day__head">
                      <span className="bos-cal-day__num">{Number(day.slice(8, 10))}</span>
                      {net.length ? (
                        <span className="bos-cal-day__net" title={net.map(([code, units]) => formatUnits(units, code, { signed: true })).join("  ")}>
                          <span data-sign={net[0][1] < 0n ? "out" : net[0][1] > 0n ? "in" : undefined}>{formatUnits(net[0][1], net[0][0], { compact: true, signed: true })}</span>
                          {net.length > 1 ? <span className="bos-cal-day__more">+{net.length - 1}</span> : null}
                        </span>
                      ) : null}
                    </span>
                    {onDay.length ? (
                      <span className="bos-cal-dots" aria-hidden>
                        {onDay.slice(0, MOBILE_DOTS).map((item) => (
                          <span key={item.id} className="bos-cal-dot" data-overdue={item.status === "overdue" ? "" : undefined} style={{ background: legendFor(item).color }} />
                        ))}
                        {onDay.length > MOBILE_DOTS ? <span className="bos-cal-dots__more">+{onDay.length - MOBILE_DOTS}</span> : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              <div className="bos-cal-bars">
                {bars
                  .filter((bar) => bar.lane < MAX_LANES)
                  .map((bar) => (
                    <Bar
                      key={bar.item.id}
                      bar={bar}
                      dragging={drag?.kind === "move" && drag.item.id === bar.item.id}
                      onClick={(item) => onBarClick(item, addDays(week[0], bar.colStart - 1))}
                      onPointerDown={(event, item) => {
                        if (!actions.canWrite || !isMovable(item)) return;
                        event.stopPropagation();
                        const origin = dayAt(event.clientX, event.clientY) ?? item.start;
                        startPress(event, { kind: "move", item, origin, x: event.clientX, y: event.clientY, dragging: false });
                      }}
                    />
                  ))}
                {hidden.map((count, index) =>
                  count > 0 ? (
                    <button
                      key={`more-${index}`}
                      type="button"
                      className="bos-cal-more"
                      style={{ gridColumn: index + 1, gridRow: MAX_LANES + 1 }}
                      onClick={() => actions.openDay(week[index])}
                      aria-label={`${count} more on ${dayLong(week[index])}`}
                    >
                      +{count} more
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
