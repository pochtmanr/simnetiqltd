"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/business-os/ui/icons";
import { Popover, useIsMobile, useSheetClose } from "@/components/business-os/ui/overlay";
import { Button, ButtonLink } from "@/components/business-os/ui/primitives";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { customWindow, formatDate, periodLabel, periodPresets, shiftPeriod, windowDates } from "@/lib/business-os/workspace/format";

/* Calendar days travel as "YYYY-MM-DD" and are shown as local-noon Dates, so no zone shifts a day. */
function toDate(day: string | null | undefined): Date | undefined {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, 12);
}

function toDay(date: Date | undefined): string {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Calendar(props: Parameters<typeof DayPicker>[0]) {
  return (
    <div className="bos-cal">
      <DayPicker weekStartsOn={1} showOutsideDays={props.mode !== "range"} fixedWeeks {...props} />
    </div>
  );
}

/**
 * Form date field: a button that opens a calendar, backed by a hidden input
 * named `name` so plain form submission keeps working. `withTime` adds a
 * 24-hour time input submitted as `${name}Time`.
 */
export function DateField({
  name,
  id,
  defaultValue,
  withTime = false,
  defaultTime = "09:00",
  placeholder = "Pick a date",
  clearable = true,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  withTime?: boolean;
  defaultTime?: string;
  placeholder?: string;
  clearable?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [time, setTime] = useState(defaultTime);
  return (
    <div className="flex items-stretch gap-2">
      <input type="hidden" name={name} value={value} />
      <div className="min-w-0 flex-1">
        <Popover
          title="Choose a date"
          buttonId={id}
          buttonClassName="bos-input !justify-start !font-normal w-full"
          label={
            <span className="flex w-full min-w-0 items-center gap-2">
              <CalendarIcon size={16} className="shrink-0 text-[var(--color-text-dim)]" />
              <span className={value ? "truncate" : "truncate text-[var(--color-text-dim)]"}>{value ? formatDate(value) : placeholder}</span>
            </span>
          }
        >
          <SingleCalendar value={value} onPick={setValue} />
        </Popover>
      </div>
      {withTime ? (
        <input
          type="time"
          name={`${name}Time`}
          value={time}
          step={60}
          onChange={(event) => setTime(event.target.value)}
          className="bos-input !w-[7.5rem]"
          aria-label="Time"
        />
      ) : null}
      {clearable && value ? (
        <Button variant="ghost" iconOnly aria-label="Clear date" onClick={() => setValue("")}>
          <CloseIcon size={16} />
        </Button>
      ) : null}
    </div>
  );
}

function SingleCalendar({ value, onPick }: { value: string; onPick: (day: string) => void }) {
  const close = useSheetClose();
  const selected = toDate(value);
  const today = toDay(new Date());
  return (
    <div className="flex flex-col gap-3 p-1">
      <Calendar
        mode="single"
        selected={selected}
        defaultMonth={selected}
        onSelect={(date) => {
          onPick(toDay(date));
          close();
        }}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            onPick(today);
            close();
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );
}

/* ---------- Period control ---------- */

/**
 * Header period switcher: ‹ label › with a popover of presets and a range
 * calendar. Presets and arrows are plain links, so they work before hydration.
 */
export function PeriodControl({ base, query }: { base: "/admin"; query: WorkspaceQuery }) {
  const previous = workspaceHref(base, query, { ...shiftPeriod(query, -1), metric: null });
  const next = workspaceHref(base, query, { ...shiftPeriod(query, 1), metric: null });
  return (
    <div className="bos-period">
      <ButtonLink href={previous} iconOnly aria-label="Previous period" variant="ghost">
        <ChevronLeftIcon />
      </ButtonLink>
      <Popover
        title="Period"
        label={
          <>
            <CalendarIcon size={16} />
            <span className="bos-period__label">{periodLabel(query)}</span>
          </>
        }
      >
        <PeriodPanel base={base} query={query} />
      </Popover>
      <ButtonLink href={next} iconOnly aria-label="Next period" variant="ghost">
        <ChevronRightIcon />
      </ButtonLink>
    </div>
  );
}

function PeriodPanel({ base, query }: { base: "/admin"; query: WorkspaceQuery }) {
  const router = useRouter();
  const close = useSheetClose();
  const mobile = useIsMobile();
  const current = windowDates(query);
  const [range, setRange] = useState<DateRange | undefined>({ from: toDate(current.from), to: toDate(current.to) });
  const presets = periodPresets();
  const activePreset = presets.find((preset) => workspaceHref(base, query, preset.patch) === workspaceHref(base, query));

  function apply() {
    if (!range?.from) return;
    const window = customWindow(toDay(range.from), toDay(range.to ?? range.from));
    close();
    router.push(workspaceHref(base, query, { grain: "custom", ...window, metric: null }));
  }

  return (
    <div className="flex flex-col gap-4 p-1 md:w-[min(42rem,80vw)]">
      <div className="bos-presets" role="group" aria-label="Quick periods">
        {presets.map((preset) => (
          <a
            key={preset.id}
            className="bos-chip"
            aria-current={activePreset?.id === preset.id ? "true" : undefined}
            href={workspaceHref(base, query, { ...preset.patch, metric: null })}
            onClick={close}
          >
            {preset.label}
          </a>
        ))}
      </div>
      <Calendar
        mode="range"
        resetOnSelect
        numberOfMonths={mobile ? 1 : 2}
        selected={range}
        onSelect={setRange}
        defaultMonth={toDate(current.from)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
        <p className="bos-caption">
          {range?.from ? `${formatDate(toDay(range.from))} – ${formatDate(toDay(range.to ?? range.from))}` : "Pick a start day"} · UK time
        </p>
        <Button variant="primary" onClick={apply} disabled={!range?.from}>
          Apply range
        </Button>
      </div>
    </div>
  );
}
