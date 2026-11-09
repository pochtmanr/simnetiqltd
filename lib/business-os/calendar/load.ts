import "server-only";
import { selectAll, userDb } from "@/lib/business-os/brain/read";
import { addDays, calendarWindow, isDay, overlaps } from "@/lib/business-os/calendar/dates";
import { mapBank, mapDocument, mapEvent, mapExpense, mapLegacy, mapNote, mapRegistration, mapSchedule, type MapContext, type Row } from "@/lib/business-os/calendar/map";
import type { CalendarData, CalendarItem, CalendarParams, CalendarSource } from "@/lib/business-os/calendar/types";
import { londonDate, londonWallToUtc } from "@/lib/business-os/finance/london";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";

/** Rows read per source; a busy month stays far below this. */
export const CALENDAR_SOURCE_LIMIT = 2000;

/** Start of the London day `day` as a UTC ISO instant, for timestamp columns. */
function londonStart(day: string): string {
  return londonWallToUtc(Number(day.slice(0, 4)), Number(day.slice(5, 7)), Number(day.slice(8, 10))).toISOString();
}

/** Everything dated in and around the visible calendar range, read with the signed-in user's client so row-level security applies. */
export async function loadCalendar(query: WorkspaceQuery, params: CalendarParams): Promise<CalendarData> {
  const db = await userDb();
  if (!db) return { error: "unauthenticated" };
  const today = londonDate(new Date());
  const window = calendarWindow(isDay(query.anchor) ? query.anchor : today, params.view);
  const { from, to } = window;
  const fromTs = londonStart(from);
  const toTs = londonStart(addDays(to, 1));
  const page = (build: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) => selectAll<Row>(build, CALENDAR_SOURCE_LIMIT);
  const inWindow = (column: string) => `and(${column}.gte.${from},${column}.lte.${to})`;

  const [projects, events, expenses, schedules, registrations, documents, notes, legacy, bank] = await Promise.all([
    db.from("projects").select("id, slug"),
    page((a, b) =>
      db
        .from("calendar_events")
        .select("id, project_id, title, notes, category, starts_on, ends_on, start_time, end_time, amount::text, currency, recurrence, status, link_kind, link_id")
        .lte("starts_on", to)
        .or(`ends_on.gte.${from},recurrence.not.is.null`)
        .order("starts_on")
        .order("id")
        .range(a, b),
    ),
    page((a, b) =>
      db
        .from("expenses")
        .select("id, workflow_kind, project_id, status, vendor, amount::text, currency, due_on, paid_on, service_on")
        .neq("status", "reversed")
        // Unpaid bills due before the window are still owed, so they load too and stay in Overdue.
        .or([inWindow("due_on"), inWindow("paid_on"), inWindow("service_on"), `and(due_on.lt.${from},paid_on.is.null,workflow_kind.eq.expense)`].join(","))
        .order("id")
        .range(a, b),
    ),
    page((a, b) =>
      db
        .from("recurring_schedules")
        .select("id, project_id, vendor, amount::text, currency, day_of_month, month_of_year, next_on, active")
        .eq("active", true)
        .lte("next_on", to)
        .order("id")
        .range(a, b),
    ),
    page((a, b) =>
      db
        .from("service_registrations")
        .select("id, project_id, name, renewal_on, due_on")
        .or([inWindow("renewal_on"), inWindow("due_on")].join(","))
        .order("id")
        .range(a, b),
    ),
    page((a, b) =>
      db
        .from("documents")
        .select("id, project_id, title, document_on, upload_status")
        .gte("document_on", from)
        .lte("document_on", to)
        .neq("upload_status", "orphaned")
        .order("document_on")
        .order("id")
        .range(a, b),
    ),
    page((a, b) => db.from("notes").select("id, project_id, title, created_at").gte("created_at", fromTs).lt("created_at", toTs).order("created_at").order("id").range(a, b)),
    page((a, b) => db.from("timeline_events").select("id, project_id, title, occurs_on").gte("occurs_on", from).lte("occurs_on", to).order("occurs_on").order("id").range(a, b)),
    params.layers.includes("bank")
      ? page((a, b) =>
          db
            .from("bank_transactions")
            .select("id, completed_at, amount::text, currency, description, counterparty, reference")
            .eq("state", "completed")
            .gte("completed_at", fromTs)
            .lt("completed_at", toTs)
            .order("completed_at")
            .order("id")
            .range(a, b),
        )
      : Promise.resolve([] as Row[]),
  ]);

  const projectById = new Map<string, string>();
  for (const row of projects.data ?? []) {
    if (typeof row.id === "string" && typeof row.slug === "string") projectById.set(row.id, row.slug);
  }
  const ctx: MapContext = { projectById, today, window };

  const failed: CalendarSource[] = [];
  const items: CalendarItem[] = [];
  const sources: [Row[] | null, CalendarSource[], (row: Row, ctx: MapContext) => CalendarItem[]][] = [
    [events, ["event"], mapEvent],
    [expenses, ["expense_due", "expense_paid", "income"], mapExpense],
    [schedules, ["recurring"], mapSchedule],
    [registrations, ["renewal", "service_due"], mapRegistration],
    [documents, ["document"], mapDocument],
    [notes, ["note"], mapNote],
    [legacy, ["legacy"], mapLegacy],
    [bank, ["bank"], mapBank],
  ];
  for (const [rows, names, map] of sources) {
    if (rows === null) {
      failed.push(...names);
      continue;
    }
    for (const row of rows) {
      for (const entry of map(row, ctx)) {
        if (overlaps(entry.start, entry.end, from, to) || (entry.status === "overdue" && entry.end < from)) items.push(entry);
      }
    }
  }
  return { items, window, params, failed };
}
