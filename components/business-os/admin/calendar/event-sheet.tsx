"use client";

import { useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/components/business-os/admin/expense-form";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { DateField } from "@/components/business-os/ui/date-picker";
import { Sheet, useToast } from "@/components/business-os/ui/overlay";
import { Button, Checkbox, Field, Input, MoneyInput, Notice, Select, Textarea } from "@/components/business-os/ui/primitives";
import { CATEGORY_LEGEND } from "@/components/business-os/admin/calendar/legend";
import type { EventPrefill } from "@/components/business-os/admin/calendar/parts";
import { isDay } from "@/lib/business-os/calendar/dates";
import { fiatScale } from "@/lib/business-os/finance/money";
import { CALENDAR_CATEGORIES, type CalendarCategory, type CalendarEventInput, type CalendarEventRecord, type RecurrenceFreq } from "@/lib/business-os/calendar/types";

export type EventSheetState = { mode: "create"; prefill: EventPrefill; key: number } | { mode: "edit"; record: CalendarEventRecord; key: number } | null;

type Errors = Partial<Record<"title" | "startsOn" | "endsOn" | "startTime" | "endTime" | "amount" | "interval" | "until", string>>;

/** Same shape the server takes: no leading zeros, digits after the point only if there are any. */
const AMOUNT = /^(0|[1-9]\d*)(\.\d+)?$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** The API and the SQL both cap the repeat interval here. */
const MAX_INTERVAL = 52;

/** Why an amount can't be saved, or null when it can: above zero and no finer than the currency's minor unit. */
export function amountError(amount: string, currency: string): string | null {
  if (!AMOUNT.test(amount) || !/[1-9]/.test(amount)) return "Enter an amount above zero, like 120 or 120.50.";
  const scale = fiatScale(currency);
  if (scale === null) return `${currency} isn't a supported currency.`;
  if ((amount.split(".")[1]?.length ?? 0) > scale) {
    return scale === 0 ? `${currency} amounts are whole numbers.` : `Use at most ${scale} decimal places for ${currency}.`;
  }
  return null;
}

function EventForm({
  formId,
  record,
  prefill,
  projects,
  onSaving,
  onDone,
}: {
  formId: string;
  record: CalendarEventRecord | null;
  prefill: EventPrefill | null;
  projects: { slug: string; name: string }[];
  onSaving: (saving: boolean) => void;
  onDone: (message: string) => void;
}) {
  const [category, setCategory] = useState<CalendarCategory>(record?.category ?? "meeting");
  const [allDay, setAllDay] = useState(record ? record.startTime === null : !prefill?.startTime);
  const [freq, setFreq] = useState<RecurrenceFreq | "none">(record?.recurrence?.freq ?? "none");
  const [errors, setErrors] = useState<Errors>({});
  const categoryButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [failure, setFailure] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const title = text("title");
    const startsOn = text("startsOn");
    const endsOn = text("endsOn") || startsOn;
    const startTime = allDay ? null : text("startTime") || null;
    const endTime = allDay ? null : text("endTime") || null;
    const amount = text("amount").replace(",", ".") || null;
    const currency = text("currency") || "GBP";
    const interval = Number(text("interval") || "1");
    const until = text("until") || null;

    const next: Errors = {};
    if (!title) next.title = "Give the event a title.";
    else if (title.length > 200) next.title = "Keep the title under 200 characters.";
    if (!isDay(startsOn)) next.startsOn = "Pick the day it starts.";
    if (!isDay(endsOn)) next.endsOn = "Pick the day it ends.";
    else if (isDay(startsOn) && endsOn < startsOn) next.endsOn = "It can't end before it starts.";
    if (!allDay) {
      if (!startTime || !TIME.test(startTime)) next.startTime = "Enter a start time, or make it all day.";
      if (endTime && !TIME.test(endTime)) next.endTime = "Enter the end as HH:MM.";
      else if (startTime && endTime && startsOn === endsOn && endTime < startTime) next.endTime = "It can't end before it starts.";
    }
    const badAmount = amount === null ? null : amountError(amount, currency);
    if (badAmount) next.amount = badAmount;
    if (freq !== "none") {
      if (!Number.isInteger(interval) || interval < 1 || interval > MAX_INTERVAL) next.interval = `Repeat every 1 to ${MAX_INTERVAL}.`;
      if (until && (!isDay(until) || until < startsOn)) next.until = "The last repeat can't come before the start.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const body: CalendarEventInput = {
      ...(record ? { id: record.id } : {}),
      title,
      notes: text("notes") || null,
      category,
      startsOn,
      endsOn,
      startTime,
      endTime,
      amount,
      currency: amount ? currency : null,
      recurrence: freq === "none" ? null : { freq, interval, until },
      status: (text("status") || "planned") as CalendarEventInput["status"],
      projectSlug: text("projectSlug") || null,
      linkKind: record?.linkKind ?? null,
      linkId: record?.linkId ?? null,
    };
    onSaving(true);
    setFailure(null);
    const response = await businessPost(record ? "/api/business-os/calendar/events/update" : "/api/business-os/calendar/events", body);
    onSaving(false);
    if (!response.ok) {
      setFailure(explainFinanceError(response.payload));
      return;
    }
    onDone(record ? "Event saved" : "Event added");
  }

  /** Arrow keys move the choice round the group, as in a native radio group. */
  function onCategoryKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const target = step ? (index + step + CALENDAR_CATEGORIES.length) % CALENDAR_CATEGORIES.length : event.key === "Home" ? 0 : event.key === "End" ? CALENDAR_CATEGORIES.length - 1 : -1;
    if (target < 0) return;
    event.preventDefault();
    setCategory(CALENDAR_CATEGORIES[target]);
    categoryButtons.current[target]?.focus();
  }

  const startTimeDefault = record?.startTime ?? prefill?.startTime ?? "09:00";
  const endTimeDefault = record?.endTime ?? prefill?.endTime ?? "10:00";

  return (
    <form id={formId} className="bos-form" onSubmit={submit} noValidate>
      {failure ? <Notice tone="bad">{failure}</Notice> : null}
      <Field label="Title" htmlFor={`${formId}-title`} error={errors.title}>
        <Input id={`${formId}-title`} name="title" defaultValue={record?.title ?? ""} autoFocus autoComplete="off" maxLength={200} aria-invalid={errors.title ? true : undefined} />
      </Field>

      <div className="bos-field">
        <span className="bos-field__label" id={`${formId}-cat`}>
          Category
        </span>
        <div className="bos-cal-cats" role="radiogroup" aria-labelledby={`${formId}-cat`}>
          {CALENDAR_CATEGORIES.map((value, index) => (
            <button
              key={value}
              ref={(element) => {
                categoryButtons.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={category === value}
              tabIndex={category === value ? 0 : -1}
              className="bos-cal-cat"
              style={{ "--cal-tone": CATEGORY_LEGEND[value].color } as CSSProperties}
              onClick={() => setCategory(value)}
              onKeyDown={(event) => onCategoryKey(event, index)}
            >
              <span className="bos-cal-cat__dot" aria-hidden />
              {CATEGORY_LEGEND[value].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bos-form__grid" data-cols="2">
        <Field label="Starts" htmlFor={`${formId}-start`} error={errors.startsOn}>
          <DateField id={`${formId}-start`} name="startsOn" defaultValue={record?.startsOn ?? prefill?.startsOn} clearable={false} />
        </Field>
        <Field label="Ends" htmlFor={`${formId}-end`} error={errors.endsOn} hint="Same day if left as is.">
          <DateField id={`${formId}-end`} name="endsOn" defaultValue={record?.endsOn ?? prefill?.endsOn ?? prefill?.startsOn} clearable={false} />
        </Field>
      </div>

      <Checkbox label="All day" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
      {allDay ? null : (
        <div className="bos-form__grid" data-cols="2">
          <Field label="Start time" htmlFor={`${formId}-st`} error={errors.startTime}>
            <Input id={`${formId}-st`} name="startTime" type="time" step={60} defaultValue={startTimeDefault} aria-invalid={errors.startTime ? true : undefined} />
          </Field>
          <Field label="End time" htmlFor={`${formId}-et`} error={errors.endTime}>
            <Input id={`${formId}-et`} name="endTime" type="time" step={60} defaultValue={endTimeDefault} aria-invalid={errors.endTime ? true : undefined} />
          </Field>
        </div>
      )}

      <Field label="Amount" htmlFor={`${formId}-amount`} error={errors.amount} hint="Optional. Planned spend for a campaign, or what a bill will cost.">
        <MoneyInput id={`${formId}-amount`} name="amount" currencies={CURRENCIES} currency={record?.currency ?? "GBP"} defaultValue={record?.amount ?? undefined} invalid={Boolean(errors.amount)} />
      </Field>

      <div className="bos-form__grid" data-cols="2">
        <Field label="Repeat" htmlFor={`${formId}-freq`}>
          <Select id={`${formId}-freq`} value={freq} onChange={(event) => setFreq(event.target.value as RecurrenceFreq | "none")}>
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </Field>
        {freq === "none" ? null : (
          <Field label={`Every how many ${freq === "weekly" ? "weeks" : freq === "monthly" ? "months" : "years"}`} htmlFor={`${formId}-interval`} error={errors.interval}>
            <Input id={`${formId}-interval`} name="interval" type="number" min={1} max={MAX_INTERVAL} defaultValue={record?.recurrence?.interval ?? 1} inputMode="numeric" />
          </Field>
        )}
      </div>
      {freq === "none" ? null : (
        <Field label="Until" htmlFor={`${formId}-until`} error={errors.until} hint="Leave empty to keep repeating.">
          <DateField id={`${formId}-until`} name="until" defaultValue={record?.recurrence?.until ?? null} placeholder="No end date" />
        </Field>
      )}

      <div className="bos-form__grid" data-cols="2">
        <Field label="Project" htmlFor={`${formId}-project`}>
          <Select id={`${formId}-project`} name="projectSlug" defaultValue={record?.projectSlug ?? ""}>
            <option value="">Whole company</option>
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor={`${formId}-status`}>
          <Select id={`${formId}-status`} name="status" defaultValue={record?.status ?? "planned"}>
            <option value="planned">Planned</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor={`${formId}-notes`}>
        <Textarea id={`${formId}-notes`} name="notes" rows={3} defaultValue={record?.notes ?? ""} />
      </Field>
    </form>
  );
}

export function EventSheet({ state, projects, onClose }: { state: EventSheetState; projects: { slug: string; name: string }[]; onClose: () => void }) {
  const formId = useId().replace(/:/g, "");
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const record = state?.mode === "edit" ? state.record : null;

  const close = () => {
    setConfirming(false);
    onClose();
  };
  const done = (message: string) => {
    toast(message);
    close();
    router.refresh();
  };

  async function remove() {
    if (!record) return;
    setDeleting(true);
    const response = await businessPost("/api/business-os/calendar/events/delete", { id: record.id });
    setDeleting(false);
    if (!response.ok) {
      toast(explainFinanceError(response.payload), "bad");
      setConfirming(false);
      return;
    }
    done("Event deleted");
  }

  return (
    <Sheet
      open={state !== null}
      onClose={close}
      title={record ? "Edit event" : "New event"}
      footer={
        <div className="bos-cal-sheetfoot">
          {record ? (
            confirming ? (
              <>
                <Button variant="danger" disabled={deleting} onClick={remove}>
                  {deleting ? "Deleting…" : record.recurrence ? "Delete the whole series" : "Delete event"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Keep
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                Delete
              </Button>
            )
          ) : null}
          <span className="flex-1" />
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} disabled={saving}>
            {saving ? "Saving…" : record ? "Save" : "Add event"}
          </Button>
        </div>
      }
    >
      {state ? (
        <EventForm
          key={state.key}
          formId={formId}
          record={state.mode === "edit" ? state.record : null}
          prefill={state.mode === "create" ? state.prefill : null}
          projects={projects}
          onSaving={setSaving}
          onDone={done}
        />
      ) : null}
    </Sheet>
  );
}
