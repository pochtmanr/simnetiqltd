import { CALENDAR_CATEGORIES } from "@/lib/business-os/calendar/types";
import { isUuid, optionalDate } from "@/lib/business-os/finance/body";
import { MoneyError, assertDecimal } from "@/lib/business-os/finance/money";

/**
 * Shapes a CalendarEventInput body into the snake_case payload the calendar RPCs take.
 * Only shapes are checked here; ordering, spans and links are enforced by the SQL.
 */

export type CalendarEventPayload = {
  id?: string;
  title: string;
  notes: string | null;
  category: string;
  starts_on: string;
  ends_on: string;
  start_time: string | null;
  end_time: string | null;
  amount: string | null;
  currency: string | null;
  recurrence: { freq: string; interval: number; until: string | null } | null;
  status: string;
  project_slug: string | null;
  link_kind: string | null;
  link_id: string | null;
};

export type Parsed<T> = { payload: T } | { error: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const FREQS = ["weekly", "monthly", "yearly"];
const STATUSES = ["planned", "done", "cancelled"];
const LINK_KINDS = ["note", "document", "expense", "registration"];

class Invalid extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function text(value: unknown, code: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Invalid(code);
  return value;
}

function date(value: unknown, code: string): string | null {
  try {
    return optionalDate(value);
  } catch (error) {
    if (error instanceof MoneyError) throw new Invalid(code);
    throw error;
  }
}

function recurrence(value: unknown): CalendarEventPayload["recurrence"] {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw new Invalid("calendar_recurrence_invalid");
  const rule = value as Record<string, unknown>;
  if (typeof rule.freq !== "string" || !FREQS.includes(rule.freq)) throw new Invalid("calendar_recurrence_invalid");
  if (typeof rule.interval !== "number" || !Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 52) {
    throw new Invalid("calendar_recurrence_invalid");
  }
  return { freq: rule.freq, interval: rule.interval, until: date(rule.until, "calendar_recurrence_invalid") };
}

function fields(body: Record<string, unknown>): CalendarEventPayload {
  if (typeof body.title !== "string") throw new Invalid("calendar_title_invalid");
  const title = body.title.trim();
  if (title.length < 1 || title.length > 200) throw new Invalid("calendar_title_invalid");

  const notes = text(body.notes, "calendar_notes_invalid");
  if (notes !== null && notes.length > 5000) throw new Invalid("calendar_notes_invalid");

  if (typeof body.category !== "string" || !(CALENDAR_CATEGORIES as readonly string[]).includes(body.category)) {
    throw new Invalid("calendar_category_invalid");
  }

  const startsOn = date(body.startsOn, "calendar_dates_invalid");
  const endsOn = date(body.endsOn, "calendar_dates_invalid");
  if (startsOn === null || endsOn === null) throw new Invalid("calendar_dates_invalid");

  const startTime = text(body.startTime, "calendar_time_invalid");
  const endTime = text(body.endTime, "calendar_time_invalid");
  if ((startTime !== null && !TIME.test(startTime)) || (endTime !== null && !TIME.test(endTime))) {
    throw new Invalid("calendar_time_invalid");
  }
  if (endTime !== null && startTime === null) throw new Invalid("calendar_time_invalid");

  const amount = text(body.amount, "calendar_money_invalid");
  const currency = text(body.currency, "calendar_money_invalid");
  if ((amount === null) !== (currency === null)) throw new Invalid("calendar_money_invalid");
  if (amount !== null) {
    try {
      assertDecimal(amount, { currency });
    } catch (error) {
      if (error instanceof MoneyError) throw new Invalid("calendar_money_invalid");
      throw error;
    }
  }

  const status = body.status === undefined ? "planned" : body.status;
  if (typeof status !== "string" || !STATUSES.includes(status)) throw new Invalid("calendar_status_invalid");

  const linkKind = text(body.linkKind, "calendar_link_invalid");
  const linkId = text(body.linkId, "calendar_link_invalid");
  if ((linkKind === null) !== (linkId === null)) throw new Invalid("calendar_link_invalid");
  if (linkKind !== null && (!LINK_KINDS.includes(linkKind) || !isUuid(linkId))) throw new Invalid("calendar_link_invalid");

  return {
    title,
    notes,
    category: body.category,
    starts_on: startsOn,
    ends_on: endsOn,
    start_time: startTime,
    end_time: endTime,
    amount,
    currency,
    recurrence: recurrence(body.recurrence),
    status,
    project_slug: text(body.projectSlug, "invalid_body"),
    link_kind: linkKind,
    link_id: linkId,
  };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Invalid("invalid_body");
  return body as Record<string, unknown>;
}

function parse<T>(build: () => T): Parsed<T> {
  try {
    return { payload: build() };
  } catch (error) {
    if (error instanceof Invalid) return { error: error.code };
    throw error;
  }
}

export function parseCalendarCreate(body: unknown): Parsed<CalendarEventPayload> {
  return parse(() => fields(asRecord(body)));
}

export function parseCalendarUpdate(body: unknown): Parsed<CalendarEventPayload> {
  return parse(() => {
    const record = asRecord(body);
    if (!isUuid(record.id)) throw new Invalid("invalid_body");
    return { id: record.id, ...fields(record) };
  });
}

export function parseCalendarDelete(body: unknown): Parsed<{ id: string }> {
  return parse(() => {
    const record = asRecord(body);
    if (!isUuid(record.id)) throw new Invalid("invalid_body");
    return { id: record.id };
  });
}
