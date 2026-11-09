/**
 * Pure civil-date helpers for the calendar. Every value is a `YYYY-MM-DD`
 * string; arithmetic runs on UTC noon so DST never shifts a day.
 * Weeks start on Monday.
 */
import type { CalendarItem, CalendarView, CalendarWindow } from "@/lib/business-os/calendar/types";

const DAY_MS = 86_400_000;

function toUtc(day: string): number {
  return Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), 12);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && fromUtc(toUtc(value)) === value;
}

export function addDays(day: string, count: number): string {
  return fromUtc(toUtc(day) + count * DAY_MS);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(day: string): number {
  return (new Date(toUtc(day)).getUTCDay() + 6) % 7;
}

export function startOfWeek(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** Same day-of-month `count` months later, clamped to the month's last day. */
export function addMonths(day: string, count: number): string {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7)) - 1 + count;
  const target = new Date(Date.UTC(year, month, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(Number(day.slice(8, 10)), last));
  return fromUtc(target.getTime());
}

/** The 42 days (6 Monday-first weeks) shown for the month containing `anchor`. */
export function monthGrid(anchor: string): string[] {
  const start = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function weekDays(anchor: string): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Days the agenda lists from its anchor. */
export const AGENDA_DAYS = 60;

/** Inclusive day range a view shows for `anchor`. */
export function viewRange(anchor: string, view: CalendarView): CalendarWindow {
  if (view === "week") {
    const days = weekDays(anchor);
    return { from: days[0], to: days[6] };
  }
  if (view === "agenda") return { from: anchor, to: addDays(anchor, AGENDA_DAYS - 1) };
  const grid = monthGrid(anchor);
  return { from: grid[0], to: grid[41] };
}

/**
 * Range the loader reads: the view's range plus a week either side, and the
 * whole agenda horizon from the month's start so view switches feel instant
 * after the next navigation.
 */
export function calendarWindow(anchor: string, view: CalendarView): CalendarWindow {
  const range = viewRange(anchor, view);
  return { from: addDays(range.from, -7), to: addDays(range.to, 7) };
}

/** True when the inclusive ranges [aFrom, aTo] and [bFrom, bTo] share a day. */
export function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

/** Items touching `day`, all-day/multi-day first, then by time and title. */
export function itemsOnDay(items: CalendarItem[], day: string): CalendarItem[] {
  return items.filter((item) => item.start <= day && day <= item.end).sort(compareItems);
}

export function compareItems(a: CalendarItem, b: CalendarItem): number {
  const aTimed = a.time !== null && a.start === a.end;
  const bTimed = b.time !== null && b.start === b.end;
  if (aTimed !== bTimed) return aTimed ? 1 : -1;
  if (a.start !== b.start) return a.start < b.start ? -1 : 1;
  const aLen = diffDays(a.start, a.end);
  const bLen = diffDays(b.start, b.end);
  if (aLen !== bLen) return bLen - aLen;
  if ((a.time ?? "") !== (b.time ?? "")) return (a.time ?? "") < (b.time ?? "") ? -1 : 1;
  return a.title.localeCompare(b.title);
}

export type WeekBar = {
  item: CalendarItem;
  /** 1-based grid column (1 = Monday). */
  colStart: number;
  /** Number of columns covered within this week (1–7). */
  span: number;
  /** 0-based row inside the week's bar area. */
  lane: number;
  /** The item started before this week (draw a flat left edge). */
  continuesLeft: boolean;
  /** The item ends after this week (draw a flat right edge). */
  continuesRight: boolean;
};

/**
 * Lays the items that touch the week starting `weekStart` into lanes so no
 * two bars overlap. Longer and earlier items take the top lanes, which keeps
 * a multi-day bar on the same lane across its days within the week.
 */
export function layoutWeekBars(items: CalendarItem[], weekStart: string): WeekBar[] {
  const weekEnd = addDays(weekStart, 6);
  const clip = (item: CalendarItem) => (item.start < weekStart ? weekStart : item.start);
  const touching = items
    .filter((item) => overlaps(item.start, item.end, weekStart, weekEnd))
    .sort((a, b) => (clip(a) === clip(b) ? compareItems(a, b) : clip(a) < clip(b) ? -1 : 1));
  const lanes: string[] = []; // last occupied day per lane
  const bars: WeekBar[] = [];
  for (const item of touching) {
    const from = item.start < weekStart ? weekStart : item.start;
    const to = item.end > weekEnd ? weekEnd : item.end;
    let lane = lanes.findIndex((lastDay) => lastDay < from);
    if (lane < 0) {
      lane = lanes.length;
      lanes.push(to);
    } else {
      lanes[lane] = to;
    }
    bars.push({
      item,
      colStart: diffDays(weekStart, from) + 1,
      span: diffDays(from, to) + 1,
      lane,
      continuesLeft: item.start < weekStart,
      continuesRight: item.end > weekEnd,
    });
  }
  return bars;
}

/** Hidden bar count per day (index 0 = Monday) when only `maxLanes` lanes are drawn. */
export function overflowByDay(bars: WeekBar[], maxLanes: number): number[] {
  const hidden = [0, 0, 0, 0, 0, 0, 0];
  for (const bar of bars) {
    if (bar.lane < maxLanes) continue;
    for (let col = bar.colStart; col < bar.colStart + bar.span; col += 1) hidden[col - 1] += 1;
  }
  return hidden;
}
