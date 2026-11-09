/**
 * Expands calendar events and recurring bill schedules into the dated
 * occurrences that touch a window. Pure; every date is a civil `YYYY-MM-DD`.
 */
import { addDays, addMonths, diffDays, overlaps } from "@/lib/business-os/calendar/dates";
import type { CalendarEventRecord, CalendarWindow } from "@/lib/business-os/calendar/types";

/** Most occurrences one series or schedule can yield, so a bad row can't spin forever. */
export const MAX_OCCURRENCES = 500;

export type Occurrence = { start: string; end: string };

/**
 * Occurrences of an event that overlap `window`. Each one keeps the event's
 * length. Monthly and yearly steps are measured from the original start, so an
 * event on the 31st lands on the 30th or 28th in short months and returns to
 * the 31st afterwards. `until` is the last day an occurrence may start.
 */
export function expandRecurrence(record: Pick<CalendarEventRecord, "startsOn" | "endsOn" | "recurrence">, window: CalendarWindow): Occurrence[] {
  const length = Math.max(0, diffDays(record.startsOn, record.endsOn));
  const rule = record.recurrence;
  if (!rule) {
    return overlaps(record.startsOn, record.endsOn, window.from, window.to) ? [{ start: record.startsOn, end: record.endsOn }] : [];
  }
  const interval = Number.isInteger(rule.interval) && rule.interval >= 1 ? rule.interval : 1;
  const nth = (n: number): string =>
    rule.freq === "weekly" ? addDays(record.startsOn, n * 7 * interval) : addMonths(record.startsOn, n * interval * (rule.freq === "yearly" ? 12 : 1));

  // Skip straight to the first occurrence that could reach the window.
  const earliest = addDays(window.from, -length);
  let n = 0;
  if (earliest > record.startsOn) {
    if (rule.freq === "weekly") n = Math.floor(diffDays(record.startsOn, earliest) / (7 * interval));
    else {
      const months = (Number(earliest.slice(0, 4)) - Number(record.startsOn.slice(0, 4))) * 12 + Number(earliest.slice(5, 7)) - Number(record.startsOn.slice(5, 7));
      n = Math.max(0, Math.floor(months / (interval * (rule.freq === "yearly" ? 12 : 1))) - 1);
    }
  }

  const out: Occurrence[] = [];
  for (let steps = 0; steps < MAX_OCCURRENCES; steps += 1, n += 1) {
    const start = nth(n);
    if (start > window.to || (rule.until && start > rule.until)) break;
    const end = addDays(start, length);
    if (end >= window.from) out.push({ start, end });
  }
  return out;
}

/** Mirrors SQL business_os.clamp_civil_date. */
function clampCivilDate(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

/** Mirrors SQL business_os.advance_schedule: next month, or next year in `monthOfYear` when set. */
export function advanceSchedule(current: string, dayOfMonth: number, monthOfYear: number | null): string {
  const year = Number(current.slice(0, 4));
  const month = Number(current.slice(5, 7));
  if (monthOfYear === null) return month === 12 ? clampCivilDate(year + 1, 1, dayOfMonth) : clampCivilDate(year, month + 1, dayOfMonth);
  return clampCivilDate(year + 1, monthOfYear, dayOfMonth);
}

/** Due dates of a recurring schedule inside `window`, starting at its stored `next_on`. */
export function projectSchedule(nextOn: string, dayOfMonth: number, monthOfYear: number | null, window: CalendarWindow): string[] {
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return [];
  if (monthOfYear !== null && (!Number.isInteger(monthOfYear) || monthOfYear < 1 || monthOfYear > 12)) return [];
  const out: string[] = [];
  let day = nextOn;
  for (let steps = 0; steps < MAX_OCCURRENCES && day <= window.to; steps += 1) {
    if (day >= window.from) out.push(day);
    day = advanceSchedule(day, dayOfMonth, monthOfYear);
  }
  return out;
}
