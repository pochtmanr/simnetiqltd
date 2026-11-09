import assert from "node:assert/strict";
import test from "node:test";
import { advanceSchedule, expandRecurrence, MAX_OCCURRENCES, projectSchedule } from "@/lib/business-os/calendar/recurrence";
import type { Recurrence } from "@/lib/business-os/calendar/types";

const event = (startsOn: string, endsOn: string, recurrence: Recurrence | null) => ({ startsOn, endsOn, recurrence });
const starts = (list: { start: string }[]) => list.map((entry) => entry.start);

test("a one-off event appears only when it overlaps the window", () => {
  assert.deepEqual(expandRecurrence(event("2026-11-05", "2026-11-05", null), { from: "2026-11-01", to: "2026-11-30" }), [{ start: "2026-11-05", end: "2026-11-05" }]);
  assert.deepEqual(expandRecurrence(event("2026-10-28", "2026-11-02", null), { from: "2026-11-01", to: "2026-11-30" }), [{ start: "2026-10-28", end: "2026-11-02" }]);
  assert.deepEqual(expandRecurrence(event("2026-10-05", "2026-10-06", null), { from: "2026-11-01", to: "2026-11-30" }), []);
});

test("weekly with an interval keeps the event's length and includes one that started before the window", () => {
  const list = expandRecurrence(event("2026-01-10", "2026-01-12", { freq: "weekly", interval: 2, until: null }), { from: "2026-11-01", to: "2026-11-30" });
  assert.deepEqual(list, [
    { start: "2026-10-31", end: "2026-11-02" },
    { start: "2026-11-14", end: "2026-11-16" },
    { start: "2026-11-28", end: "2026-11-30" },
  ]);
});

test("until is the last day an occurrence may start", () => {
  const rule: Recurrence = { freq: "weekly", interval: 1, until: "2026-11-15" };
  assert.deepEqual(starts(expandRecurrence(event("2026-11-01", "2026-11-01", rule), { from: "2026-11-01", to: "2026-11-30" })), ["2026-11-01", "2026-11-08", "2026-11-15"]);
});

test("monthly on the 31st clamps to short months without drifting", () => {
  const list = expandRecurrence(event("2026-01-31", "2026-01-31", { freq: "monthly", interval: 1, until: null }), { from: "2026-01-01", to: "2026-05-31" });
  assert.deepEqual(starts(list), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
});

test("monthly from long ago skips ahead and respects the interval", () => {
  const list = expandRecurrence(event("2020-01-15", "2020-01-15", { freq: "monthly", interval: 3, until: null }), { from: "2026-10-19", to: "2026-12-13" });
  assert.deepEqual(starts(list), []); // Jan, Apr, Jul, Oct 15: Oct 15 is before the window, the next is Jan 2027
  const wider = expandRecurrence(event("2020-01-15", "2020-01-15", { freq: "monthly", interval: 3, until: null }), { from: "2026-10-01", to: "2027-01-31" });
  assert.deepEqual(starts(wider), ["2026-10-15", "2027-01-15"]);
});

test("yearly on 29 February falls on the 28th in other years", () => {
  const list = expandRecurrence(event("2028-02-29", "2028-02-29", { freq: "yearly", interval: 1, until: null }), { from: "2028-01-01", to: "2032-12-31" });
  assert.deepEqual(starts(list), ["2028-02-29", "2029-02-28", "2030-02-28", "2031-02-28", "2032-02-29"]);
});

test("a multi-day yearly event that straddles the window start is kept", () => {
  const list = expandRecurrence(event("2024-12-30", "2025-01-02", { freq: "yearly", interval: 1, until: null }), { from: "2027-01-01", to: "2027-01-31" });
  assert.deepEqual(list, [{ start: "2026-12-30", end: "2027-01-02" }]);
});

test("runaway series are capped", () => {
  const list = expandRecurrence(event("2026-01-01", "2026-01-01", { freq: "weekly", interval: 1, until: null }), { from: "2026-01-01", to: "2099-12-31" });
  assert.equal(list.length, MAX_OCCURRENCES);
});

test("advanceSchedule mirrors the SQL: next month, or next year in month_of_year, clamped", () => {
  assert.equal(advanceSchedule("2026-01-31", 31, null), "2026-02-28");
  assert.equal(advanceSchedule("2026-02-28", 31, null), "2026-03-31");
  assert.equal(advanceSchedule("2026-12-05", 5, null), "2027-01-05");
  assert.equal(advanceSchedule("2027-02-28", 29, 2), "2028-02-29");
});

test("projectSchedule lists due dates inside the window from next_on", () => {
  assert.deepEqual(projectSchedule("2026-09-30", 31, null, { from: "2026-10-19", to: "2026-12-13" }), ["2026-10-31", "2026-11-30"]);
  assert.deepEqual(projectSchedule("2026-11-10", 10, 11, { from: "2026-01-01", to: "2028-12-31" }), ["2026-11-10", "2027-11-10", "2028-11-10"]);
  assert.deepEqual(projectSchedule("2027-01-01", 1, null, { from: "2026-11-01", to: "2026-11-30" }), []);
  assert.equal(projectSchedule("1900-01-01", 1, null, { from: "1900-01-01", to: "2200-01-01" }).length, MAX_OCCURRENCES);
});
