"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { RepeatIcon } from "@/components/business-os/ui/icons";
import { cx } from "@/components/business-os/ui/primitives";
import { dayShort } from "@/components/business-os/admin/calendar/clock";
import { SOURCE_LEGEND, STATUS_LEGEND, isSettled, legendFor } from "@/components/business-os/admin/calendar/legend";
import { formatAmount } from "@/components/business-os/admin/calendar/money";
import type { WeekBar } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

/** Lanes a month row draws before it counts the rest as "+N more". */
export const MAX_LANES = 3;

/** What a create gesture knows: the days, and the times when it came from an hour slot. */
export type EventPrefill = { startsOn: string; endsOn: string; startTime?: string | null; endTime?: string | null };

/** Everything a view can ask the section root to do. */
export type CalendarActions = {
  canWrite: boolean;
  openDay: (day: string) => void;
  newEvent: (prefill: EventPrefill) => void;
  editEvent: (item: CalendarItem) => void;
  moveEvent: (item: CalendarItem, days: number) => void;
  markDone: (item: CalendarItem) => void;
  deleteEvent: (item: CalendarItem) => Promise<boolean>;
};

/** Timed items sit on the hours grid; anything multi-day or untimed is an all-day bar. */
export function isTimed(item: CalendarItem): boolean {
  return item.time !== null && item.start === item.end;
}

/** Only one-off events made here can be dragged; a repeat would move its whole series. */
export function isMovable(item: CalendarItem): boolean {
  return item.editable && !item.repeat && Boolean(item.record);
}

export function itemLabel(item: CalendarItem): string {
  const when = item.start === item.end ? dayShort(item.start) : `${dayShort(item.start)} to ${dayShort(item.end)}`;
  const parts = [item.title, legendFor(item).label, item.time ? `${when} at ${item.time}` : when];
  const amount = formatAmount(item.amount, item.currency, item.direction);
  if (amount) parts.push(amount);
  if (item.status !== "planned") parts.push(STATUS_LEGEND[item.status].label);
  if (item.repeat) parts.push("Repeats");
  return parts.join(", ");
}

export function toneStyle(item: Pick<CalendarItem, "category" | "source">): CSSProperties {
  return { "--cal-tone": legendFor(item).color } as CSSProperties;
}

export function SourceBadge({ item }: { item: CalendarItem }) {
  const legend = legendFor(item);
  return (
    <span className="bos-cal-badge" style={toneStyle(item)} title={item.category ? `${legend.label} · ${SOURCE_LEGEND[item.source].label}` : legend.label}>
      <span className="bos-cal-badge__glyph" aria-hidden>
        {legend.glyph}
      </span>
      {legend.label}
    </span>
  );
}

export function RepeatGlyph() {
  return <RepeatIcon size={11} className="bos-cal-repeat" />;
}

/** The text inside a bar or chip: time, title, amount and the repeat mark. */
export function ItemText({ item, showTime = true, showAmount = true }: { item: CalendarItem; showTime?: boolean; showAmount?: boolean }) {
  const amount = showAmount ? formatAmount(item.amount, item.currency, item.direction) : null;
  return (
    <>
      {showTime && item.time ? <span className="bos-cal-bar__time">{item.time}</span> : null}
      <span className="bos-cal-bar__title">{item.title}</span>
      {item.repeat ? <RepeatGlyph /> : null}
      {amount ? (
        <span className="bos-cal-bar__amount" data-direction={item.direction ?? undefined}>
          {amount}
        </span>
      ) : null}
    </>
  );
}

/** Flags every view uses to draw an item the same way. */
export function itemData(item: CalendarItem) {
  return {
    "data-overdue": item.status === "overdue" ? "" : undefined,
    "data-settled": isSettled(item) ? "" : undefined,
  };
}

/** A spanning bar in the month rows and the week's all-day lane. */
export function Bar({
  bar,
  dragging,
  onClick,
  onPointerDown,
}: {
  bar: WeekBar;
  dragging?: boolean;
  onClick: (item: CalendarItem) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, item: CalendarItem) => void;
}) {
  const { item } = bar;
  const startsHere = !bar.continuesLeft;
  return (
    <button
      type="button"
      className={cx("bos-cal-bar", isMovable(item) && "bos-cal-bar--movable")}
      style={{ ...toneStyle(item), gridColumn: `${bar.colStart} / span ${bar.span}`, gridRow: bar.lane + 1 }}
      data-cl={bar.continuesLeft ? "" : undefined}
      data-cr={bar.continuesRight ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      {...itemData(item)}
      aria-label={itemLabel(item)}
      title={itemLabel(item)}
      onClick={() => onClick(item)}
      onPointerDown={onPointerDown ? (event) => onPointerDown(event, item) : undefined}
    >
      {/* A bar split across weeks carries its time and amount once, where it starts. */}
      <ItemText item={item} showTime={startsHere} showAmount={startsHere} />
    </button>
  );
}
