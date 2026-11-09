/**
 * Calendar contract shared by the loader, the API and the admin UI.
 *
 * Every dated thing in Business OS becomes a CalendarItem: events made on the
 * calendar itself, plus rows from other tabs (expenses, recurring bills,
 * registrations, files, notes, bank). Dates are civil `YYYY-MM-DD` days in
 * Europe/London; `end` is inclusive, so a one-day item has start === end.
 */

export const CALENDAR_CATEGORIES = ["advertising", "bill", "deadline", "meeting"] as const;
export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

export const CALENDAR_SOURCES = [
  "event", // calendar_events, made here (editable)
  "expense_due", // expenses.due_on, not yet paid
  "expense_paid", // expenses.paid_on
  "income", // manual income expenses rows (workflow_kind = manual_income)
  "recurring", // recurring_schedules projected forward
  "renewal", // service_registrations.renewal_on
  "service_due", // service_registrations.due_on
  "document", // documents.document_on
  "note", // notes.created_at
  "bank", // bank_transactions.completed_at (layer, off by default)
  "legacy", // timeline_events (older one-day manual events, read-only here)
] as const;
export type CalendarSource = (typeof CALENDAR_SOURCES)[number];

export const CALENDAR_VIEWS = ["month", "week", "agenda"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const CALENDAR_LAYERS = ["bank"] as const;
export type CalendarLayer = (typeof CALENDAR_LAYERS)[number];

export type CalendarStatus = "planned" | "done" | "cancelled" | "overdue" | "paid" | "pending";

export type RecurrenceFreq = "weekly" | "monthly" | "yearly";
export type Recurrence = { freq: RecurrenceFreq; interval: number; until: string | null };

export type CalendarLinkKind = "note" | "document" | "expense" | "registration";

/** A calendar_events row as stored, used by the edit form. */
export type CalendarEventRecord = {
  id: string;
  title: string;
  notes: string | null;
  category: CalendarCategory;
  startsOn: string;
  endsOn: string;
  startTime: string | null; // "HH:MM"
  endTime: string | null; // "HH:MM"
  amount: string | null;
  currency: string | null;
  recurrence: Recurrence | null;
  status: "planned" | "done" | "cancelled";
  projectSlug: string | null;
  linkKind: CalendarLinkKind | null;
  linkId: string | null;
};

export type CalendarItem = {
  /** Unique per occurrence: `${source}:${sourceId}` or `${source}:${sourceId}:${start}` for repeats. */
  id: string;
  source: CalendarSource;
  sourceId: string;
  /** Only events made on the calendar carry a category. */
  category: CalendarCategory | null;
  title: string;
  start: string;
  end: string;
  time: string | null;
  endTime: string | null;
  /** Positive decimal string; see `direction` for the sign. */
  amount: string | null;
  currency: string | null;
  direction: "in" | "out" | null;
  status: CalendarStatus;
  projectSlug: string | null;
  /** Deep link to the row in its own tab, or null when there is none. */
  href: string | null;
  editable: boolean;
  /** True for occurrences generated from a recurrence rule. */
  repeat: boolean;
  /** Present on `event` items so the form can edit the series. */
  record?: CalendarEventRecord;
};

export type CalendarParams = {
  view: CalendarView;
  layers: CalendarLayer[];
};

export type CalendarWindow = { from: string; to: string };

export type CalendarData =
  | {
      items: CalendarItem[];
      window: CalendarWindow;
      params: CalendarParams;
      /** Sources that failed to load; the page names them instead of failing whole. */
      failed: CalendarSource[];
    }
  | { error: string };

/**
 * Body of POST /api/business-os/calendar/events (create) and
 * POST /api/business-os/calendar/events/update (with `id`).
 * Delete is POST /api/business-os/calendar/events/delete with `{ id }`.
 * The routes answer `{ result: { id } }` or an error code (see explainFinanceError).
 */
export type CalendarEventInput = {
  id?: string;
  title: string;
  notes: string | null;
  category: CalendarCategory;
  startsOn: string;
  endsOn: string;
  startTime: string | null;
  endTime: string | null;
  amount: string | null;
  currency: string | null;
  recurrence: Recurrence | null;
  status: "planned" | "done" | "cancelled";
  projectSlug: string | null;
  linkKind: CalendarLinkKind | null;
  linkId: string | null;
};
