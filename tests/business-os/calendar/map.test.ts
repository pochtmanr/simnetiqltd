import assert from "node:assert/strict";
import test from "node:test";
import { eventRecord, mapBank, mapDocument, mapEvent, mapExpense, mapLegacy, mapNote, mapRegistration, mapSchedule, type MapContext } from "@/lib/business-os/calendar/map";

const ctx: MapContext = {
  projectById: new Map([["p1", "acme"]]),
  today: "2026-11-08",
  window: { from: "2026-10-19", to: "2026-12-13" },
};

const eventRow = (overrides: Record<string, unknown> = {}) => ({
  id: "e1",
  project_id: "p1",
  title: "Pay hosting",
  notes: null,
  category: "bill",
  starts_on: "2026-11-03",
  ends_on: "2026-11-03",
  start_time: "09:30:00",
  end_time: null,
  amount: "12.50",
  currency: "GBP",
  recurrence: null,
  status: "planned",
  link_kind: null,
  link_id: null,
  ...overrides,
});

test("event: record fields, times trimmed, past planned bill is overdue", () => {
  const [item] = mapEvent(eventRow(), ctx);
  assert.equal(item.id, "event:e1");
  assert.equal(item.source, "event");
  assert.equal(item.category, "bill");
  assert.equal(item.time, "09:30");
  assert.equal(item.status, "overdue");
  assert.equal(item.direction, "out");
  assert.equal(item.projectSlug, "acme");
  assert.equal(item.editable, true);
  assert.equal(item.repeat, false);
  assert.equal(item.href, null);
  assert.equal(item.record?.startTime, "09:30");
});

test("event: meetings, future bills, done and cancelled keep the row status", () => {
  assert.equal(mapEvent(eventRow({ category: "meeting" }), ctx)[0].status, "planned");
  assert.equal(mapEvent(eventRow({ starts_on: "2026-11-20", ends_on: "2026-11-20" }), ctx)[0].status, "planned");
  assert.equal(mapEvent(eventRow({ status: "done" }), ctx)[0].status, "done");
  assert.equal(mapEvent(eventRow({ status: "cancelled" }), ctx)[0].status, "cancelled");
  assert.equal(mapEvent(eventRow({ amount: null }), ctx)[0].direction, null);
});

test("event: a deadline whose last day is today is not yet overdue", () => {
  assert.equal(mapEvent(eventRow({ category: "deadline", starts_on: "2026-11-01", ends_on: "2026-11-08" }), ctx)[0].status, "planned");
});

test("event: past occurrences of a repeating bill are not overdue", () => {
  const items = mapEvent(eventRow({ starts_on: "2026-06-01", ends_on: "2026-06-01", recurrence: { freq: "monthly", interval: 1, until: null } }), ctx);
  assert.ok(items.length >= 2);
  assert.ok(items.every((item) => item.status === "planned"));
});

test("event: recurrences expand with per-occurrence ids", () => {
  const items = mapEvent(eventRow({ category: "meeting", recurrence: { freq: "weekly", interval: 2, until: "2026-12-01" } }), ctx);
  assert.deepEqual(
    items.map((item) => item.id),
    ["event:e1:2026-11-03", "event:e1:2026-11-17", "event:e1:2026-12-01"],
  );
  assert.ok(items.every((item) => item.repeat && item.sourceId === "e1"));
  assert.deepEqual(items[0].record?.recurrence, { freq: "weekly", interval: 2, until: "2026-12-01" });
});

test("event: links become deep links; malformed rows are skipped", () => {
  assert.equal(mapEvent(eventRow({ link_kind: "note", link_id: "n9" }), ctx)[0].href, "/admin?section=notes&note=n9");
  assert.equal(mapEvent(eventRow({ link_kind: "document", link_id: "d1" }), ctx)[0].href, "/admin?section=documents");
  assert.equal(mapEvent(eventRow({ link_kind: "expense", link_id: "x1" }), ctx)[0].href, "/admin?section=expenses");
  assert.equal(mapEvent(eventRow({ link_kind: "registration", link_id: "r1" }), ctx)[0].href, "/admin?section=records");
  assert.deepEqual(mapEvent(eventRow({ category: "party" }), ctx), []);
  assert.deepEqual(mapEvent(eventRow({ starts_on: "2026-02-30" }), ctx), []);
  assert.equal(eventRecord(eventRow({ ends_on: null }), ctx.projectById)?.endsOn, "2026-11-03");
});

const expenseRow = (overrides: Record<string, unknown> = {}) => ({
  id: "x1",
  workflow_kind: "expense",
  project_id: null,
  status: "posted",
  vendor: "Hetzner",
  amount: "40.00",
  currency: "EUR",
  due_on: "2026-11-01",
  paid_on: null,
  service_on: null,
  ...overrides,
});

test("expense: unpaid due is overdue when past, pending otherwise", () => {
  const [past] = mapExpense(expenseRow(), ctx);
  assert.deepEqual(
    { id: past.id, source: past.source, status: past.status, direction: past.direction, title: past.title, amount: past.amount, href: past.href },
    { id: "expense_due:x1", source: "expense_due", status: "overdue", direction: "out", title: "Hetzner", amount: "40.00", href: "/admin?section=expenses" },
  );
  assert.equal(mapExpense(expenseRow({ due_on: "2026-11-08" }), ctx)[0].status, "pending");
  assert.equal(mapExpense(expenseRow({ vendor: null }), ctx)[0].title, "Expense due");
});

test("expense: paid shows on the paid day; reversed is dropped", () => {
  const [paid] = mapExpense(expenseRow({ paid_on: "2026-11-02" }), ctx);
  assert.equal(paid.source, "expense_paid");
  assert.equal(paid.start, "2026-11-02");
  assert.equal(paid.status, "paid");
  assert.deepEqual(mapExpense(expenseRow({ status: "reversed" }), ctx), []);
});

test("income: direction in, dated paid_on, then due_on, then service_on", () => {
  const [income] = mapExpense(expenseRow({ workflow_kind: "manual_income", due_on: null, service_on: "2026-11-04", vendor: null }), ctx);
  assert.deepEqual({ id: income.id, direction: income.direction, start: income.start, status: income.status, title: income.title }, { id: "income:x1", direction: "in", start: "2026-11-04", status: "pending", title: "Income" });
  assert.equal(mapExpense(expenseRow({ workflow_kind: "manual_income", paid_on: "2026-11-05" }), ctx)[0].start, "2026-11-05");
  assert.equal(mapExpense(expenseRow({ workflow_kind: "manual_income", paid_on: "2026-11-05" }), ctx)[0].status, "paid");
});

test("recurring: projected through the window as repeats", () => {
  const items = mapSchedule({ id: "s1", project_id: "p1", vendor: null, amount: "9.99", currency: "USD", day_of_month: 31, month_of_year: null, next_on: "2026-10-31", active: true }, ctx);
  assert.deepEqual(
    items.map((item) => [item.id, item.status]),
    [
      ["recurring:s1:2026-10-31", "overdue"],
      ["recurring:s1:2026-11-30", "pending"],
    ],
  );
  assert.ok(items.every((item) => item.repeat && item.direction === "out" && item.title === "Recurring expense" && item.projectSlug === "acme"));
});

test("registration: renewal and a different due day; same day only once", () => {
  const items = mapRegistration({ id: "r1", project_id: null, name: "Companies House", renewal_on: "2026-11-20", due_on: "2026-11-01" }, ctx);
  assert.deepEqual(
    items.map((item) => [item.id, item.status, item.href]),
    [
      ["renewal:r1", "pending", "/admin?section=records"],
      ["service_due:r1", "overdue", "/admin?section=records"],
    ],
  );
  assert.equal(mapRegistration({ id: "r1", name: "VAT", renewal_on: "2026-11-20", due_on: "2026-11-20" }, ctx).length, 1);
});

test("document and note", () => {
  const [doc] = mapDocument({ id: "d1", project_id: null, title: "Invoice", document_on: "2026-11-03", upload_status: "stored" }, ctx);
  assert.deepEqual([doc.id, doc.start, doc.href], ["document:d1", "2026-11-03", "/admin?section=documents"]);
  assert.deepEqual(mapDocument({ id: "d2", title: "Lost", document_on: "2026-11-03", upload_status: "orphaned" }, ctx), []);
  // 23:30 UTC on 24 Oct is 00:30 BST on 25 Oct, so the note belongs to the 25th in London.
  const [note] = mapNote({ id: "n1", title: "Plan", created_at: "2026-10-24T23:30:00+00:00" }, ctx);
  assert.deepEqual([note.id, note.start, note.href], ["note:n1", "2026-10-25", "/admin?section=notes&note=n1"]);
});

test("legacy timeline events are read-only and have no link", () => {
  const [past] = mapLegacy({ id: "t1", project_id: "p1", title: "Launch", occurs_on: "2026-11-01" }, ctx);
  assert.deepEqual([past.id, past.status, past.editable, past.href, past.projectSlug], ["legacy:t1", "done", false, null, "acme"]);
  assert.equal(mapLegacy({ id: "t2", title: "Next", occurs_on: "2026-11-30" }, ctx)[0].status, "planned");
});

test("bank: sign gives direction, amount is absolute", () => {
  const [out] = mapBank({ id: "b1", completed_at: "2026-11-02T10:00:00Z", amount: "-25.10", currency: "GBP", description: "Card", counterparty: "Tesco" }, ctx);
  assert.deepEqual([out.id, out.direction, out.amount, out.title, out.href, out.start], ["bank:b1", "out", "25.10", "Tesco", "/admin?section=bank", "2026-11-02"]);
  const [incoming] = mapBank({ id: "b2", completed_at: "2026-11-02T10:00:00Z", amount: "100", currency: "GBP", description: "Stripe payout", counterparty: null }, ctx);
  assert.deepEqual([incoming.direction, incoming.amount, incoming.title], ["in", "100", "Stripe payout"]);
  assert.deepEqual(mapBank({ id: "b3", completed_at: null, amount: "1" }, ctx), []);
});
