import assert from "node:assert/strict";
import test from "node:test";
import { addDays, addMonths, calendarWindow, diffDays, isDay, layoutWeekBars, monthGrid, overflowByDay, viewRange, weekdayIndex } from "@/lib/business-os/calendar/dates";
import type { CalendarItem } from "@/lib/business-os/calendar/types";

function bar(id: string, start: string, end = start): CalendarItem {
  return {
    id,
    source: "event",
    sourceId: id,
    category: null,
    title: id,
    start,
    end,
    time: null,
    endTime: null,
    amount: null,
    currency: null,
    direction: null,
    status: "planned",
    projectSlug: null,
    href: null,
    editable: false,
    repeat: false,
  };
}

test("monthGrid is 42 Monday-first days; November 2026 starts on Monday 26 October", () => {
  const grid = monthGrid("2026-11-15");
  assert.equal(grid.length, 42);
  assert.equal(grid[0], "2026-10-26");
  assert.equal(weekdayIndex(grid[0]), 0);
  assert.equal(grid[41], "2026-12-06");
});

test("addMonths clamps to the month's last day", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-12-15", 1), "2027-01-15");
  assert.equal(addMonths("2026-03-31", -1), "2026-02-28");
});

test("addDays and diffDays cross a DST change without drifting", () => {
  assert.equal(addDays("2026-10-24", 2), "2026-10-26");
  assert.equal(diffDays("2026-03-28", "2026-03-30"), 2);
});

test("isDay rejects impossible and malformed days", () => {
  assert.equal(isDay("2026-02-28"), true);
  assert.equal(isDay("2026-02-30"), false);
  assert.equal(isDay("2026-2-3"), false);
  assert.equal(isDay(20260203), false);
});

test("viewRange and calendarWindow for each view", () => {
  assert.deepEqual(viewRange("2026-11-11", "month"), { from: "2026-10-26", to: "2026-12-06" });
  assert.deepEqual(calendarWindow("2026-11-11", "month"), { from: "2026-10-19", to: "2026-12-13" });
  assert.deepEqual(viewRange("2026-11-11", "week"), { from: "2026-11-09", to: "2026-11-15" });
  assert.deepEqual(calendarWindow("2026-11-11", "week"), { from: "2026-11-02", to: "2026-11-22" });
  assert.deepEqual(viewRange("2026-11-11", "agenda"), { from: "2026-11-11", to: "2027-01-09" });
  assert.deepEqual(calendarWindow("2026-11-11", "agenda"), { from: "2026-11-04", to: "2027-01-16" });
});

test("layoutWeekBars splits a bar at week boundaries", () => {
  const item = bar("trip", "2026-11-07", "2026-11-18");
  const [first] = layoutWeekBars([item], "2026-11-02");
  assert.deepEqual({ col: first.colStart, span: first.span, left: first.continuesLeft, right: first.continuesRight }, { col: 6, span: 2, left: false, right: true });
  const [middle] = layoutWeekBars([item], "2026-11-09");
  assert.deepEqual({ col: middle.colStart, span: middle.span, left: middle.continuesLeft, right: middle.continuesRight }, { col: 1, span: 7, left: true, right: true });
  const [last] = layoutWeekBars([item], "2026-11-16");
  assert.deepEqual({ col: last.colStart, span: last.span, left: last.continuesLeft, right: last.continuesRight }, { col: 1, span: 3, left: true, right: false });
  assert.deepEqual(layoutWeekBars([item], "2026-11-23"), []);
});

test("layoutWeekBars puts overlaps on different lanes and reuses a free lane", () => {
  const bars = layoutWeekBars([bar("a", "2026-11-09", "2026-11-11"), bar("b", "2026-11-10", "2026-11-12"), bar("c", "2026-11-12", "2026-11-13")], "2026-11-09");
  const lane = Object.fromEntries(bars.map((entry) => [entry.item.id, entry.lane]));
  assert.equal(lane.a, 0);
  assert.equal(lane.b, 1);
  assert.equal(lane.c, 0);
});

test("overflowByDay counts bars below maxLanes per day", () => {
  const items = [
    bar("long", "2026-11-09", "2026-11-12"),
    bar("x", "2026-11-10"),
    bar("y", "2026-11-10"),
    bar("z", "2026-11-10", "2026-11-11"),
    bar("w", "2026-11-11"),
  ];
  const bars = layoutWeekBars(items, "2026-11-09");
  assert.deepEqual(overflowByDay(bars, 3), [0, 1, 0, 0, 0, 0, 0]);
  assert.deepEqual(overflowByDay(bars, 1), [0, 3, 2, 0, 0, 0, 0]);
});
