import assert from "node:assert/strict";
import test from "node:test";
import { parseCalendarCreate, parseCalendarDelete, parseCalendarUpdate } from "@/lib/business-os/calendar/body";

const ID = "00000000-0000-4000-8000-000000000001";

function input(extra: Record<string, unknown> = {}) {
  return {
    title: "  Pay Azure  ",
    notes: "",
    category: "bill",
    startsOn: "2026-11-10",
    endsOn: "2026-11-10",
    startTime: "09:00",
    endTime: "09:30",
    amount: "42.50",
    currency: "GBP",
    recurrence: { freq: "monthly", interval: 1, until: null },
    status: "planned",
    projectSlug: "doppler",
    linkKind: "expense",
    linkId: ID,
    ...extra,
  };
}

test("calendar body: maps camelCase input to the snake_case payload", () => {
  assert.deepEqual(parseCalendarCreate(input()), {
    payload: {
      title: "Pay Azure",
      notes: null,
      category: "bill",
      starts_on: "2026-11-10",
      ends_on: "2026-11-10",
      start_time: "09:00",
      end_time: "09:30",
      amount: "42.50",
      currency: "GBP",
      recurrence: { freq: "monthly", interval: 1, until: null },
      status: "planned",
      project_slug: "doppler",
      link_kind: "expense",
      link_id: ID,
    },
  });
});

test("calendar body: empty optional fields become null and status defaults to planned", () => {
  const parsed = parseCalendarCreate(
    input({ startTime: null, endTime: "", amount: "", currency: null, recurrence: null, status: undefined, projectSlug: "", linkKind: null, linkId: "" }),
  );
  assert.ok("payload" in parsed);
  assert.deepEqual(
    [parsed.payload.start_time, parsed.payload.end_time, parsed.payload.amount, parsed.payload.currency, parsed.payload.recurrence],
    [null, null, null, null, null],
  );
  assert.equal(parsed.payload.status, "planned");
  assert.deepEqual([parsed.payload.project_slug, parsed.payload.link_kind, parsed.payload.link_id], [null, null, null]);
});

test("calendar body: rejects bad shapes with a calendar code", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ title: 3 }, "calendar_title_invalid"],
    [{ title: "   " }, "calendar_title_invalid"],
    [{ title: "x".repeat(201) }, "calendar_title_invalid"],
    [{ notes: "x".repeat(5001) }, "calendar_notes_invalid"],
    [{ category: "party" }, "calendar_category_invalid"],
    [{ startsOn: "10/11/2026" }, "calendar_dates_invalid"],
    [{ endsOn: null }, "calendar_dates_invalid"],
    [{ startTime: "9:00" }, "calendar_time_invalid"],
    [{ endTime: "24:00" }, "calendar_time_invalid"],
    [{ startTime: null }, "calendar_time_invalid"],
    [{ amount: 42.5 }, "calendar_money_invalid"],
    [{ currency: null }, "calendar_money_invalid"],
    [{ amount: null }, "calendar_money_invalid"],
    [{ amount: "4.505" }, "calendar_money_invalid"],
    [{ currency: "ZZZ" }, "calendar_money_invalid"],
    [{ recurrence: { freq: "daily", interval: 1, until: null } }, "calendar_recurrence_invalid"],
    [{ recurrence: { freq: "weekly", interval: 1.5, until: null } }, "calendar_recurrence_invalid"],
    [{ recurrence: { freq: "weekly", interval: 53, until: null } }, "calendar_recurrence_invalid"],
    [{ recurrence: { freq: "weekly", interval: 1, until: "never" } }, "calendar_recurrence_invalid"],
    [{ recurrence: ["weekly"] }, "calendar_recurrence_invalid"],
    [{ status: "overdue" }, "calendar_status_invalid"],
    [{ linkId: null }, "calendar_link_invalid"],
    [{ linkKind: "invoice" }, "calendar_link_invalid"],
    [{ linkId: "not-a-uuid" }, "calendar_link_invalid"],
    [{ projectSlug: 7 }, "invalid_body"],
  ];
  for (const [extra, code] of cases) assert.deepEqual(parseCalendarCreate(input(extra)), { error: code }, JSON.stringify(extra));
  assert.deepEqual(parseCalendarCreate(null), { error: "invalid_body" });
  assert.deepEqual(parseCalendarCreate([]), { error: "invalid_body" });
});

test("calendar body: update needs a uuid id; delete takes only the id", () => {
  const updated = parseCalendarUpdate(input({ id: ID }));
  assert.ok("payload" in updated);
  assert.equal(updated.payload.id, ID);
  assert.deepEqual(parseCalendarUpdate(input()), { error: "invalid_body" });
  assert.deepEqual(parseCalendarUpdate(input({ id: "nope" })), { error: "invalid_body" });
  assert.deepEqual(parseCalendarDelete({ id: ID, title: "ignored" }), { payload: { id: ID } });
  assert.deepEqual(parseCalendarDelete({}), { error: "invalid_body" });
});
