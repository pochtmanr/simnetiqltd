import { CALENDAR_LAYERS, CALENDAR_VIEWS, type CalendarLayer, type CalendarParams, type CalendarView } from "@/lib/business-os/calendar/types";

/** Reads `view` and `layers` from the admin URL; anything unknown falls back to the month view with no layers. */
export function parseCalendarParams(params: Record<string, string | string[] | undefined>): CalendarParams {
  const pick = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const rawView = pick("view");
  const view: CalendarView = rawView && (CALENDAR_VIEWS as readonly string[]).includes(rawView) ? (rawView as CalendarView) : "month";
  const layers = (pick("layers") ?? "")
    .split(",")
    .filter((layer): layer is CalendarLayer => (CALENDAR_LAYERS as readonly string[]).includes(layer));
  return { view, layers: [...new Set(layers)] };
}

/** Builds a calendar URL on top of a workspace href, keeping only the calendar params that differ from the defaults. */
export function withCalendarParams(href: string, params: CalendarParams): string {
  const url = new URL(href, "http://x");
  if (params.view !== "month") url.searchParams.set("view", params.view);
  else url.searchParams.delete("view");
  if (params.layers.length) url.searchParams.set("layers", params.layers.join(","));
  else url.searchParams.delete("layers");
  return `${url.pathname}?${url.searchParams.toString()}`;
}
