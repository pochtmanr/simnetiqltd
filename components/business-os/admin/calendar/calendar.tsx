"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/business-os/ui/icons";
import { useToast } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink, Notice, cx } from "@/components/business-os/ui/primitives";
import { Agenda } from "@/components/business-os/admin/calendar/agenda";
import { dayShort, monthTitle, useToday } from "@/components/business-os/admin/calendar/clock";
import { DayPanel } from "@/components/business-os/admin/calendar/day-panel";
import { EventSheet, type EventSheetState } from "@/components/business-os/admin/calendar/event-sheet";
import { CATEGORY_LEGEND, SOURCE_LEGEND, filterKey } from "@/components/business-os/admin/calendar/legend";
import { MonthGrid } from "@/components/business-os/admin/calendar/month-grid";
import type { CalendarActions, EventPrefill } from "@/components/business-os/admin/calendar/parts";
import { Summary } from "@/components/business-os/admin/calendar/summary";
import { WeekView } from "@/components/business-os/admin/calendar/week-view";
import { AGENDA_DAYS, addDays, addMonths, isDay, startOfMonth, viewRange } from "@/lib/business-os/calendar/dates";
import { withCalendarParams } from "@/lib/business-os/calendar/params";
import { CALENDAR_CATEGORIES, CALENDAR_SOURCES, type CalendarItem, type CalendarParams, type CalendarView } from "@/lib/business-os/calendar/types";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { humanize } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";

const MIGRATION = "20261108150000_calendar.sql";
const VIEWS: [CalendarView, string, string][] = [
  ["month", "Month", "M"],
  ["week", "Week", "W"],
  ["agenda", "Agenda", "A"],
];

/* ---------- Hidden filters, remembered per browser ---------- */

const HIDDEN_KEY = "bos-calendar-hidden";
const HIDDEN_EVENT = "bos-calendar-hidden-change";
let hiddenMemory: string | null = null;

function readHidden(): string {
  if (hiddenMemory !== null) return hiddenMemory;
  try {
    return window.localStorage.getItem(HIDDEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeHidden(keys: string[]) {
  hiddenMemory = keys.join(",");
  try {
    window.localStorage.setItem(HIDDEN_KEY, hiddenMemory);
  } catch {
    /* storage can be blocked; the choice still holds for this visit */
  }
  window.dispatchEvent(new Event(HIDDEN_EVENT));
}

function subscribeHidden(callback: () => void) {
  // Another tab changed the filters: read them from storage again.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== HIDDEN_KEY) return;
    hiddenMemory = null;
    callback();
  };
  window.addEventListener(HIDDEN_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(HIDDEN_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/* ---------- Optimistic changes, dropped when fresh data arrives ---------- */

type Override = { start?: string; end?: string; status?: CalendarItem["status"]; record?: CalendarItem["record"]; deleted?: boolean };

/** A drag shifts the shown days and the record by the same distance, so the length is kept. */
export function moveChange(item: CalendarItem, days: number): Override & { start: string; end: string } {
  const start = addDays(item.start, days);
  const end = addDays(item.end, days);
  return { start, end, record: item.record && { ...item.record, startsOn: start, endsOn: end } };
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function rangeTitle(anchor: string, view: CalendarView): string {
  if (view === "month") return monthTitle(anchor);
  const range = viewRange(anchor, view);
  return `${dayShort(range.from)} – ${dayShort(range.to)} ${range.to.slice(0, 4)}`;
}

function shift(anchor: string, view: CalendarView, direction: 1 | -1): string {
  if (view === "month") return addMonths(startOfMonth(anchor), direction);
  if (view === "week") return addDays(anchor, 7 * direction);
  return addDays(anchor, (AGENDA_DAYS / 2) * direction);
}

export function Calendar({ query, data, canWrite }: { query: WorkspaceQuery; data: WorkspaceData; canWrite: boolean }) {
  const calendar = data.calendar;
  if (!calendar || "error" in calendar) {
    return (
      <Notice tone="bad">
        The calendar couldn&apos;t load{calendar && "error" in calendar ? ` (${humanize(calendar.error).toLowerCase()})` : ""}. Reload the page to try again.
      </Notice>
    );
  }
  return <CalendarBody query={query} items={calendar.items} params={calendar.params} failed={calendar.failed} projects={data.projects} canWrite={canWrite} />;
}

function CalendarBody({
  query,
  items: loaded,
  params,
  failed,
  projects,
  canWrite,
}: {
  query: WorkspaceQuery;
  items: CalendarItem[];
  params: CalendarParams;
  failed: string[];
  projects: { slug: string; name: string }[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const today = useToday();
  const anchor = isDay(query.anchor) ? query.anchor : today;
  const view = params.view;
  const range = viewRange(anchor, view);
  const bankOn = params.layers.includes("bank");

  const href = useCallback(
    (nextAnchor: string, patch: Partial<CalendarParams> = {}) => withCalendarParams(workspaceHref("/admin", query, { anchor: nextAnchor }), { ...params, ...patch }),
    [query, params],
  );

  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [overridesFor, setOverridesFor] = useState(loaded);
  if (overridesFor !== loaded) {
    setOverridesFor(loaded);
    setOverrides({});
  }
  const items = useMemo(
    () =>
      loaded.flatMap((item) => {
        const change = overrides[item.id];
        if (!change) return [item];
        if (change.deleted) return [];
        return [{ ...item, ...change }];
      }),
    [loaded, overrides],
  );

  const hiddenRaw = useSyncExternalStore(subscribeHidden, readHidden, () => "");
  const hidden = useMemo(() => new Set(hiddenRaw.split(",").filter(Boolean)), [hiddenRaw]);
  const visible = useMemo(() => items.filter((item) => item.source === "bank" || !hidden.has(filterKey(item))), [items, hidden]);

  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.source === "bank") continue;
      const key = filterKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const list: { key: string; label: string; color: string; count: number }[] = [];
    for (const category of CALENDAR_CATEGORIES) {
      const count = counts.get(`category:${category}`);
      if (count) list.push({ key: `category:${category}`, label: CATEGORY_LEGEND[category].label, color: CATEGORY_LEGEND[category].color, count });
    }
    for (const source of CALENDAR_SOURCES) {
      const count = counts.get(`source:${source}`);
      if (count) list.push({ key: `source:${source}`, label: SOURCE_LEGEND[source].label, color: SOURCE_LEGEND[source].color, count });
    }
    return list;
  }, [items]);

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [sheet, setSheet] = useState<EventSheetState>(null);
  const [flashKey, setFlashKey] = useState(0);
  const sheetKey = useRef(0);

  const newEvent = useCallback((prefill: EventPrefill) => {
    sheetKey.current += 1;
    setOpenDay(null);
    setSheet({ mode: "create", prefill, key: sheetKey.current });
  }, []);

  const update = useCallback(
    async (item: CalendarItem, change: Override, patch: Partial<NonNullable<CalendarItem["record"]>>, message: string) => {
      if (!item.record) return;
      let previous: Override | undefined;
      setOverrides((current) => {
        previous = current[item.id];
        return { ...current, [item.id]: { ...current[item.id], ...change } };
      });
      const response = await businessPost("/api/business-os/calendar/events/update", { ...item.record, ...patch, id: item.record.id });
      if (!response.ok) {
        // Back to what was shown before this change; an earlier change still waiting for the refresh stays.
        setOverrides((current) => {
          const next = { ...current };
          if (previous) next[item.id] = previous;
          else delete next[item.id];
          return next;
        });
        toast(explainFinanceError(response.payload), "bad");
        return;
      }
      toast(message);
      router.refresh();
    },
    [router, toast],
  );

  const actions: CalendarActions = useMemo(
    () => ({
      canWrite,
      openDay: setOpenDay,
      newEvent,
      editEvent: (item) => {
        if (!item.record || !canWrite) return;
        sheetKey.current += 1;
        setOpenDay(null);
        setSheet({ mode: "edit", record: item.record, key: sheetKey.current });
      },
      moveEvent: (item, days) => {
        if (!item.record) return;
        const change = moveChange(item, days);
        void update(item, change, { startsOn: change.start, endsOn: change.end }, `Moved to ${dayShort(change.start)}`);
      },
      markDone: (item) => void update(item, { status: "done" }, { status: "done" }, "Marked done"),
      deleteEvent: async (item) => {
        if (!item.record) return false;
        const response = await businessPost("/api/business-os/calendar/events/delete", { id: item.record.id });
        if (!response.ok) {
          toast(explainFinanceError(response.payload), "bad");
          return false;
        }
        // A deleted series takes every occurrence with it.
        const sourceId = item.sourceId;
        setOverrides((current) => {
          const next = { ...current };
          for (const other of loaded) if (other.source === "event" && other.sourceId === sourceId) next[other.id] = { deleted: true };
          return next;
        });
        toast("Event deleted");
        router.refresh();
        return true;
      },
    }),
    [canWrite, newEvent, update, toast, router, loaded],
  );

  const prevHref = href(shift(anchor, view, -1));
  const nextHref = href(shift(anchor, view, 1));
  const todayHref = href(today);
  const todayInView = today >= range.from && today <= range.to && (view !== "month" || today.slice(0, 7) === anchor.slice(0, 7));

  const goToday = useCallback(() => {
    setFlashKey((key) => key + 1);
    if (!todayInView) router.push(todayHref);
  }, [router, todayHref, todayInView]);

  const startNew = useCallback(() => newEvent({ startsOn: todayInView ? today : anchor, endsOn: todayInView ? today : anchor }), [newEvent, today, anchor, todayInView]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const key = event.key.toLowerCase();
      if (event.key === "ArrowLeft") router.push(prevHref);
      else if (event.key === "ArrowRight") router.push(nextHref);
      else if (key === "t") goToday();
      else if (key === "m" || key === "w" || key === "a") {
        const next = VIEWS.find(([, , shortcut]) => shortcut.toLowerCase() === key)?.[0];
        if (next && next !== view) router.push(href(anchor, { view: next }));
      } else if (key === "n" && canWrite) startNew();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref, goToday, view, href, anchor, canWrite, startNew]);

  const navigate = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    router.push(target);
  };

  const failedSources = failed.filter((source) => source !== "event");
  const eventsFailed = failed.includes("event");
  const nothingHere = visible.filter((item) => item.end >= range.from && item.start <= range.to).length === 0;

  return (
    <div className="bos-cal-root">
      {eventsFailed ? (
        <Notice tone="warn">
          Events made on the calendar couldn&apos;t load, so only dates from the other tabs are shown. If the calendar is new here, apply migration <code className="bos-mono">{MIGRATION}</code>.
        </Notice>
      ) : null}
      {failedSources.length ? (
        <Notice tone="warn">
          Some dates are missing because these couldn&apos;t load: {failedSources.map((source) => (SOURCE_LEGEND[source as keyof typeof SOURCE_LEGEND]?.label ?? humanize(source)).toLowerCase()).join(", ")}.
        </Notice>
      ) : null}

      <header className="bos-cal-head">
        <div className="bos-cal-nav">
          <ButtonLink href={prevHref} onClick={navigate(prevHref)} variant="ghost" iconOnly aria-label="Previous" aria-keyshortcuts="ArrowLeft" title="Previous (←)">
            <ChevronLeftIcon />
          </ButtonLink>
          <h2 className="bos-cal-title" aria-live="polite">
            {rangeTitle(anchor, view)}
          </h2>
          <ButtonLink href={nextHref} onClick={navigate(nextHref)} variant="ghost" iconOnly aria-label="Next" aria-keyshortcuts="ArrowRight" title="Next (→)">
            <ChevronRightIcon />
          </ButtonLink>
          <ButtonLink
            href={todayHref}
            size="sm"
            aria-keyshortcuts="T"
            title="Today (T)"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey) return;
              event.preventDefault();
              goToday();
            }}
          >
            Today
          </ButtonLink>
        </div>
        <div className="bos-cal-head__end">
          <nav className="bos-seg" aria-label="View">
            {VIEWS.map(([value, label, shortcut]) => {
              const target = href(anchor, { view: value });
              return (
                <a key={value} href={target} onClick={navigate(target)} className="bos-seg__item" aria-current={view === value ? "true" : undefined} aria-keyshortcuts={shortcut} title={`${label} (${shortcut})`}>
                  {label}
                </a>
              );
            })}
          </nav>
          {canWrite ? (
            <Button variant="primary" onClick={startNew} aria-keyshortcuts="N" aria-label="New event" title="New event (N)">
              <PlusIcon size={16} />
              New<span className="bos-cal-wide"> event</span>
            </Button>
          ) : null}
        </div>
      </header>

      <Summary items={visible} range={range} />

      <div className="bos-chips bos-cal-filters" role="group" aria-label="Show on the calendar">
        {chips.map((chip) => {
          const on = !hidden.has(chip.key);
          return (
            <button
              key={chip.key}
              type="button"
              className="bos-chip bos-cal-chip"
              aria-pressed={on}
              style={{ "--cal-tone": chip.color } as CSSProperties}
              onClick={() => writeHidden(on ? [...hidden, chip.key] : [...hidden].filter((key) => key !== chip.key))}
            >
              <span className="bos-cal-chip__dot" aria-hidden />
              {chip.label}
              <span className="bos-cal-chip__count bos-num">{chip.count}</span>
            </button>
          );
        })}
        <a
          href={href(anchor, { layers: bankOn ? [] : ["bank"] })}
          onClick={navigate(href(anchor, { layers: bankOn ? [] : ["bank"] }))}
          className={cx("bos-chip bos-cal-chip bos-cal-chip--layer")}
          data-on={bankOn ? "" : undefined}
          aria-label={`Bank transactions, ${bankOn ? "on" : "off"}`}
          style={{ "--cal-tone": SOURCE_LEGEND.bank.color } as CSSProperties}
          title={bankOn ? "Hide bank transactions" : "Show bank transactions"}
        >
          <span className="bos-cal-chip__dot" aria-hidden />
          Bank
          <span className="bos-cal-chip__count">{bankOn ? "On" : "Off"}</span>
        </a>
      </div>

      {view === "month" ? (
        <MonthGrid anchor={anchor} items={visible} today={today} flashKey={flashKey} actions={actions} />
      ) : view === "week" ? (
        <WeekView anchor={anchor} items={visible} today={today} actions={actions} />
      ) : (
        <Agenda anchor={anchor} items={visible} today={today} actions={actions} />
      )}
      {view !== "agenda" && nothingHere ? (
        <p className="bos-caption bos-cal-quiet">
          Nothing dated in this {view}.
          {canWrite ? (
            <>
              <span className="bos-cal-wide"> Drag across days or press N to add an event.</span>
              <span className="bos-cal-narrow"> Tap a day to add an event.</span>
            </>
          ) : null}
        </p>
      ) : null}
      {view !== "agenda" ? (
        <p className="bos-caption bos-cal-keys bos-desktop-only">
          <kbd>←</kbd> <kbd>→</kbd> move, <kbd>T</kbd> today, <kbd>M</kbd> <kbd>W</kbd> <kbd>A</kbd> switch view{canWrite ? (
            <>
              , <kbd>N</kbd> new event, or drag across days
            </>
          ) : null}
          .
        </p>
      ) : null}

      <DayPanel day={openDay} items={visible} today={today} actions={actions} onClose={() => setOpenDay(null)} />
      <EventSheet state={sheet} projects={projects} onClose={() => setSheet(null)} />
    </div>
  );
}
