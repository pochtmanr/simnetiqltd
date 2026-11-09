"use client";

import { useSyncExternalStore } from "react";
import { londonDate, londonTime } from "@/lib/business-os/finance/london";

/* Calendar days are civil days in Europe/London, so "today" and "now" are too. */

function subscribeMinute(callback: () => void) {
  const timer = window.setInterval(callback, 30_000);
  return () => window.clearInterval(timer);
}

export function todayInLondon(): string {
  return londonDate(new Date());
}

/** Today's day, ticking over at midnight. The server renders the same day, so hydration agrees. */
export function useToday(): string {
  return useSyncExternalStore(subscribeMinute, todayInLondon, todayInLondon);
}

/** Minutes past midnight in London, or null before hydration so the now-line never mismatches. */
export function useNowMinutes(): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => {
      const [hour, minute] = londonTime(new Date()).split(":").map(Number);
      return hour * 60 + minute;
    },
    () => null,
  );
}

export function minutesOf(time: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

const noon = (day: string) => new Date(`${day}T12:00:00Z`);
const MONTH_TITLE = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_HEAD = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const DAY_LONG = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DAY_SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

/** "November 2026" */
export const monthTitle = (day: string) => MONTH_TITLE.format(noon(day));
/** "Mon 9 Nov" */
export const dayHead = (day: string) => DAY_HEAD.format(noon(day)).replace(",", "");
/** "Monday 9 November 2026" */
export const dayLong = (day: string) => DAY_LONG.format(noon(day)).replace(",", "");
/** "9 Nov" */
export const dayShort = (day: string) => DAY_SHORT.format(noon(day));
/** "Mon" */
export const weekdayShort = (day: string) => WEEKDAY.format(noon(day));
