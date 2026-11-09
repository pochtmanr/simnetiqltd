import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Calendar, moveChange } from "@/components/business-os/admin/calendar/calendar";
import { amountError } from "@/components/business-os/admin/calendar/event-sheet";
import type { CalendarData, CalendarItem, CalendarSource, CalendarView } from "@/lib/business-os/calendar/types";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

const query: WorkspaceQuery = {
  section: "timeline",
  grain: "month",
  basis: "purchase",
  anchor: "2026-11-09",
  from: "2026-10-31T23:00:00.000Z",
  to: "2026-11-30T23:00:00.000Z",
  project: null,
  currency: null,
  source: null,
  status: null,
  metric: null,
};

const base: WorkspaceData = {
  projects: [{ id: "p1", slug: "doppler", name: "Doppler", state: "unverified", reportingEnabled: false }],
  categories: { rows: [] },
  company: { error: "not_loaded", report: null },
  byProject: [],
  drill: null,
  observations: { rows: [] },
  expenses: { rows: [] },
  snapshots: { rows: [] },
  health: { rows: [] },
  connections: [],
  gates: { rows: [] },
  runs: { rows: [] },
  quarantine: { rows: [] },
} as unknown as WorkspaceData;

function item(id: string, patch: Partial<CalendarItem>): CalendarItem {
  return {
    id: `event:${id}`,
    source: "event",
    sourceId: id,
    category: "meeting",
    title: id,
    start: "2026-11-10",
    end: "2026-11-10",
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
    ...patch,
  };
}

const fixtures: CalendarItem[] = [
  // Friday 6 to Wednesday 11 November: crosses the Monday 9 week boundary.
  item("campaign", { title: "Black Friday campaign", category: "advertising", start: "2026-11-06", end: "2026-11-11", amount: "500.00", currency: "GBP", direction: "out" }),
  item("bill", { title: "Hosting bill", category: null, source: "expense_due", start: "2026-11-12", end: "2026-11-12", amount: "40.00", currency: "USD", direction: "out", href: "/admin?section=expenses" }),
  item("late", { title: "VAT return", category: "deadline", start: "2026-11-02", end: "2026-11-02", status: "overdue" }),
  // Four on one day: three lanes show, one goes to "+1 more".
  ...["a", "b", "c", "d"].map((key) => item(`busy-${key}`, { title: `Busy ${key}`, start: "2026-11-20", end: "2026-11-20" })),
];

/** Client sections call useRouter; static rendering has no app router, so give them an inert one. */
const router = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };

function html(calendar: CalendarData | undefined, { view = "month", anchor = query.anchor }: { view?: CalendarView; anchor?: string } = {}) {
  const data = calendar && !("error" in calendar) ? { ...calendar, params: { ...calendar.params, view } } : calendar;
  return renderToStaticMarkup(
    createElement(
      AppRouterContext.Provider,
      { value: router as never },
      createElement(Calendar, { query: { ...query, anchor }, data: { ...base, calendar: data }, canWrite: true }),
    ),
  );
}

const loaded = (items: CalendarItem[], failed: CalendarSource[] = []): CalendarData => ({
  items,
  window: { from: "2026-10-19", to: "2026-12-13" },
  params: { view: "month", layers: [] },
  failed,
});

function barTags(markup: string, title: string): string[] {
  return [...markup.matchAll(/<button[^>]*class="bos-cal-bar[^"]*"[^>]*>/g)].map((match) => match[0]).filter((tag) => tag.includes(`aria-label="${title},`));
}

test("month view titles the month and splits a multi-day bar at the week boundary", () => {
  const markup = html(loaded(fixtures));
  assert.match(markup, /<h2 class="bos-cal-title"[^>]*>November 2026<\/h2>/);
  const bars = barTags(markup, "Black Friday campaign");
  assert.equal(bars.length, 2);
  assert.ok(bars[0].includes('data-cr=""') && !bars[0].includes('data-cl=""'), "first week's piece continues right");
  assert.ok(bars[1].includes('data-cl=""') && !bars[1].includes('data-cr=""'), "second week's piece continues left");
  assert.match(markup, />\+1 more</);
  assert.match(markup, /Busy a/);
});

test("agenda pins overdue items and groups the rest by day", () => {
  const markup = html(loaded(fixtures), { view: "agenda" });
  const overdue = markup.indexOf("<strong>Overdue</strong>");
  // The campaign started before the anchor, so it is listed on the anchor's day.
  const monday = markup.indexOf("Mon 9 Nov");
  const thursday = markup.indexOf("Thu 12 Nov");
  const friday = markup.indexOf("Fri 20 Nov");
  assert.ok(overdue >= 0 && monday > overdue && thursday > monday && friday > thursday, "overdue first, then days in order");
  assert.doesNotMatch(markup, /Tue 10 Nov/);
  // Different currencies never add together in the running balance.
  assert.match(markup, /−£500\.00/);
  assert.match(markup, /−US\$40\.00|−\$40\.00/);
});

test("the calendar says when it could not load", () => {
  assert.match(html(undefined), /calendar couldn.+t load/);
  assert.match(html({ error: "calendar_unavailable" }), /calendar couldn.+t load \(calendar unavailable\)/);
});

test("an empty agenda invites a new event", () => {
  const markup = html(loaded([]), { view: "agenda" });
  assert.match(markup, /Nothing planned from 9 Nov to 7 Jan/);
  assert.match(markup, /New event/);
});

test("the bank layer chip is a link and off by default", () => {
  const markup = html(loaded(fixtures));
  const chip = /<a[^>]*class="bos-chip bos-cal-chip bos-cal-chip--layer"[^>]*>/.exec(markup)?.[0] ?? "";
  assert.match(chip, /href="[^"]*layers=bank/);
  assert.doesNotMatch(chip, /data-on/);
  assert.match(markup, /Bank<span class="bos-cal-chip__count">Off<\/span>/);
});

test("a missing events table names the migration and failed sources by name", () => {
  const markup = html(loaded(fixtures.filter((entry) => entry.source !== "event"), ["event", "renewal"]));
  assert.match(markup, /20261108150000_calendar\.sql/);
  assert.match(markup, /couldn.+t load: renewal/);
});

test("the week's all-day lane says how many more there are and opens the day", () => {
  const crowded = [...fixtures, ...["e", "f"].map((key) => item(`busy-${key}`, { title: `Busy ${key}`, start: "2026-11-20", end: "2026-11-20" }))];
  const markup = html(loaded(crowded), { view: "week", anchor: "2026-11-20" });
  assert.match(markup, /<button[^>]*class="bos-cal-more"[^>]*aria-label="2 more on [^"]*20 November[^"]*"[^>]*>\+2 more<\/button>/);
});

test("a drag moves the shown days and the record together, keeping the length", () => {
  // Already moved once and waiting for the refresh: the record still has the loaded days.
  const record = { id: "r1", title: "Trip", notes: null, category: "meeting", startsOn: "2026-11-10", endsOn: "2026-11-11", startTime: null, endTime: null, amount: null, currency: null, recurrence: null, status: "planned", projectSlug: null, linkKind: null, linkId: null } as unknown as NonNullable<CalendarItem["record"]>;
  const shown = item("trip", { start: "2026-11-12", end: "2026-11-13", editable: true, record: { ...record, startsOn: "2026-11-12", endsOn: "2026-11-13" } });
  const change = moveChange(shown, 3);
  assert.equal(change.start, "2026-11-15");
  assert.equal(change.end, "2026-11-16");
  assert.equal(change.record?.startsOn, "2026-11-15");
  assert.equal(change.record?.endsOn, "2026-11-16");
});

test("the event form takes amounts above zero, no finer than the currency's minor unit", () => {
  assert.equal(amountError("120", "GBP"), null);
  assert.equal(amountError("120.50", "GBP"), null);
  assert.equal(amountError("0.01", "USD"), null);
  for (const bad of ["0", "0.00", "007", "1.", "-5"]) assert.ok(amountError(bad, "GBP"), bad);
  assert.match(amountError("12.345", "GBP") ?? "", /2 decimal places/);
  assert.match(amountError("1.5", "JPY") ?? "", /whole numbers/);
});

test("an empty month suggests dragging on desktop and tapping on phones", () => {
  const markup = html(loaded([]), { anchor: "2027-02-10" });
  assert.match(markup, /<span class="bos-cal-wide"> Drag across days or press N to add an event\.<\/span>/);
  assert.match(markup, /<span class="bos-cal-narrow"> Tap a day to add an event\.<\/span>/);
});
