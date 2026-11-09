/**
 * Pure mappers from database rows to CalendarItems, kept apart from the
 * loader so they can be tested without a database. Rows arrive as PostgREST
 * returns them: dates as `YYYY-MM-DD`, money as text, timestamps as ISO text.
 */
import { isDay } from "@/lib/business-os/calendar/dates";
import { expandRecurrence, projectSchedule } from "@/lib/business-os/calendar/recurrence";
import {
  CALENDAR_CATEGORIES,
  type CalendarCategory,
  type CalendarEventRecord,
  type CalendarItem,
  type CalendarLinkKind,
  type CalendarStatus,
  type CalendarWindow,
  type Recurrence,
} from "@/lib/business-os/calendar/types";
import { londonDate } from "@/lib/business-os/finance/london";

export type Row = Record<string, unknown>;
export type MapContext = { projectById: Map<string, string>; today: string; window: CalendarWindow };

const text = (value: unknown): string | null => (typeof value === "string" ? value : null);
const day = (value: unknown): string | null => (isDay(value) ? value : null);
const time = (value: unknown): string | null => (typeof value === "string" && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : null);

function project(row: Row, ctx: MapContext): string | null {
  const id = text(row.project_id);
  return id ? (ctx.projectById.get(id) ?? null) : null;
}

/** Dated obligations: overdue once their day has passed, pending until then. */
function dueStatus(on: string, today: string): CalendarStatus {
  return on < today ? "overdue" : "pending";
}

export const HREF = {
  expenses: "/admin?section=expenses",
  documents: "/admin?section=documents",
  records: "/admin?section=records",
  bank: "/admin?section=bank",
  note: (id: string) => `/admin?section=notes&note=${encodeURIComponent(id)}`,
} as const;

function linkHref(kind: CalendarLinkKind | null, id: string | null): string | null {
  if (kind === "note") return id ? HREF.note(id) : null;
  if (kind === "document") return HREF.documents;
  if (kind === "expense") return HREF.expenses;
  if (kind === "registration") return HREF.records;
  return null;
}

type Base = Pick<CalendarItem, "source" | "sourceId" | "title" | "start" | "status" | "projectSlug" | "href"> & Partial<CalendarItem>;

function item(base: Base): CalendarItem {
  return {
    id: `${base.source}:${base.sourceId}`,
    category: null,
    end: base.start,
    time: null,
    endTime: null,
    amount: null,
    currency: null,
    direction: null,
    editable: false,
    repeat: false,
    ...base,
  };
}

function parseRecurrence(value: unknown): Recurrence | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.freq !== "weekly" && raw.freq !== "monthly" && raw.freq !== "yearly") return null;
  const interval = typeof raw.interval === "number" && Number.isInteger(raw.interval) && raw.interval >= 1 ? raw.interval : 1;
  return { freq: raw.freq, interval, until: day(raw.until) };
}

const LINK_KINDS: readonly CalendarLinkKind[] = ["note", "document", "expense", "registration"];

/** A calendar_events row as the edit form needs it, or null when the row is malformed. */
export function eventRecord(row: Row, projectById: Map<string, string>): CalendarEventRecord | null {
  const id = text(row.id);
  const title = text(row.title);
  const startsOn = day(row.starts_on);
  const endsOn = day(row.ends_on) ?? startsOn;
  const category = (CALENDAR_CATEGORIES as readonly string[]).includes(String(row.category)) ? (row.category as CalendarCategory) : null;
  if (!id || !title || !startsOn || !endsOn || !category) return null;
  const status = row.status === "done" || row.status === "cancelled" ? row.status : "planned";
  const linkKind = (LINK_KINDS as readonly unknown[]).includes(row.link_kind) ? (row.link_kind as CalendarLinkKind) : null;
  const projectId = text(row.project_id);
  return {
    id,
    title,
    notes: text(row.notes),
    category,
    startsOn,
    endsOn: endsOn < startsOn ? startsOn : endsOn,
    startTime: time(row.start_time),
    endTime: time(row.end_time),
    amount: text(row.amount),
    currency: text(row.currency),
    recurrence: parseRecurrence(row.recurrence),
    status,
    projectSlug: projectId ? (projectById.get(projectId) ?? null) : null,
    linkKind,
    linkId: linkKind ? text(row.link_id) : null,
  };
}

/** Every occurrence of a calendar_events row inside the window. */
export function mapEvent(row: Row, ctx: MapContext): CalendarItem[] {
  const record = eventRecord(row, ctx.projectById);
  if (!record) return [];
  const repeat = record.recurrence !== null;
  return expandRecurrence(record, ctx.window).map(({ start, end }) => {
    // Status is stored once per series, so only one-off events can be overdue;
    // otherwise every past month of a repeating bill would stay overdue forever.
    const overdue = !repeat && record.status === "planned" && end < ctx.today && (record.category === "bill" || record.category === "deadline");
    return item({
      id: repeat ? `event:${record.id}:${start}` : `event:${record.id}`,
      source: "event",
      sourceId: record.id,
      category: record.category,
      title: record.title,
      start,
      end,
      time: record.startTime,
      endTime: record.endTime,
      amount: record.amount,
      currency: record.currency,
      direction: record.amount ? "out" : null,
      status: overdue ? "overdue" : record.status,
      projectSlug: record.projectSlug,
      href: linkHref(record.linkKind, record.linkId),
      editable: true,
      repeat,
      record,
    });
  });
}

/** An expenses row: due (unpaid), paid, or a manual income entry. Reversed rows are left out. */
export function mapExpense(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  if (!id || row.status === "reversed") return [];
  const dueOn = day(row.due_on);
  const paidOn = day(row.paid_on);
  const vendor = text(row.vendor);
  const shared = { sourceId: id, amount: text(row.amount), currency: text(row.currency), projectSlug: project(row, ctx), href: HREF.expenses };
  if (row.workflow_kind === "manual_income") {
    const on = paidOn ?? dueOn ?? day(row.service_on);
    if (!on) return [];
    return [item({ ...shared, source: "income", title: vendor ?? "Income", start: on, direction: "in", status: paidOn ? "paid" : "pending" })];
  }
  if (row.workflow_kind !== "expense") return [];
  if (paidOn) return [item({ ...shared, source: "expense_paid", title: vendor ?? "Expense", start: paidOn, direction: "out", status: "paid" })];
  if (dueOn) return [item({ ...shared, source: "expense_due", title: vendor ?? "Expense due", start: dueOn, direction: "out", status: dueStatus(dueOn, ctx.today) })];
  return [];
}

/** An active recurring_schedules row projected through the window. */
export function mapSchedule(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const nextOn = day(row.next_on);
  if (!id || !nextOn || row.active === false) return [];
  const dayOfMonth = Number(row.day_of_month);
  const monthOfYear = row.month_of_year === null || row.month_of_year === undefined ? null : Number(row.month_of_year);
  return projectSchedule(nextOn, dayOfMonth, monthOfYear, ctx.window).map((on) =>
    item({
      id: `recurring:${id}:${on}`,
      source: "recurring",
      sourceId: id,
      title: text(row.vendor) ?? "Recurring expense",
      start: on,
      amount: text(row.amount),
      currency: text(row.currency),
      direction: "out",
      status: dueStatus(on, ctx.today),
      projectSlug: project(row, ctx),
      href: HREF.expenses,
      repeat: true,
    }),
  );
}

/** A service_registrations row: its renewal day, and its due day when that differs. */
export function mapRegistration(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return [];
  const renewalOn = day(row.renewal_on);
  const dueOn = day(row.due_on);
  const out: CalendarItem[] = [];
  const shared = { sourceId: id, title: name, projectSlug: project(row, ctx), href: HREF.records };
  if (renewalOn) out.push(item({ ...shared, source: "renewal", start: renewalOn, status: dueStatus(renewalOn, ctx.today) }));
  if (dueOn && dueOn !== renewalOn) out.push(item({ ...shared, source: "service_due", start: dueOn, status: dueStatus(dueOn, ctx.today) }));
  return out;
}

export function mapDocument(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const on = day(row.document_on);
  const title = text(row.title);
  if (!id || !on || !title || row.upload_status === "orphaned") return [];
  return [item({ source: "document", sourceId: id, title, start: on, status: "done", projectSlug: project(row, ctx), href: HREF.documents })];
}

function londonDay(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const instant = new Date(raw);
  return Number.isNaN(instant.getTime()) ? null : londonDate(instant);
}

/** A note on the London day it was created. */
export function mapNote(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const on = londonDay(row.created_at);
  const title = text(row.title);
  if (!id || !on || !title) return [];
  return [item({ source: "note", sourceId: id, title, start: on, status: "done", projectSlug: project(row, ctx), href: HREF.note(id) })];
}

/** An older one-day timeline_events row; read-only here. */
export function mapLegacy(row: Row, ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const on = day(row.occurs_on);
  const title = text(row.title);
  if (!id || !on || !title) return [];
  return [item({ source: "legacy", sourceId: id, title, start: on, status: on < ctx.today ? "done" : "planned", projectSlug: project(row, ctx), href: null })];
}

/** A completed bank transaction: money in when the amount is positive, out when negative. */
export function mapBank(row: Row, _ctx: MapContext): CalendarItem[] {
  const id = text(row.id);
  const on = londonDay(row.completed_at);
  const amount = text(row.amount);
  if (!id || !on || amount === null) return [];
  const negative = amount.trim().startsWith("-");
  return [
    item({
      source: "bank",
      sourceId: id,
      title: text(row.counterparty) ?? text(row.description) ?? text(row.reference) ?? "Bank transaction",
      start: on,
      amount: negative ? amount.trim().slice(1) : amount.trim(),
      currency: text(row.currency),
      direction: negative ? "out" : "in",
      status: "paid",
      projectSlug: null,
      href: HREF.bank,
    }),
  ];
}

