"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { businessPost, explainFinanceError, resultRecord } from "@/components/business-os/business-post";
import { DateField } from "@/components/business-os/ui/date-picker";
import { ChevronDownIcon } from "@/components/business-os/ui/icons";
import { useSheetClose, useToast } from "@/components/business-os/ui/overlay";
import { Button, Field, Input, MoneyInput, Notice, Select } from "@/components/business-os/ui/primitives";

export const CURRENCIES = ["GBP", "USD", "EUR", "ILS"] as const;
const CURRENCY_KEY = "bos-last-currency";

function rememberedCurrency(): string {
  try {
    return window.localStorage.getItem(CURRENCY_KEY) ?? "GBP";
  } catch {
    return "GBP";
  }
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * New expense or manual income. Saves a draft, then optionally posts it and
 * allocates it to the chosen project — the same three calls the API exposes.
 * If a later step fails the draft is kept and the message says what is left.
 */
export function ExpenseForm({
  projects,
  categories,
  defaultKind = "expense",
  defaultProject,
}: {
  projects: { slug: string; name: string }[];
  categories: { code: string; name: string }[] | null;
  defaultKind?: "expense" | "manual_income";
  defaultProject?: string | null;
}) {
  const router = useRouter();
  const close = useSheetClose();
  const toast = useToast();
  const [kind, setKind] = useState(defaultKind);
  const [more, setMore] = useState(false);
  const [pending, setPending] = useState<"draft" | "post" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency] = useState(rememberedCurrency);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const post = submitter?.value === "post";
    setPending(post ? "post" : "draft");
    setError(null);
    const form = new FormData(event.currentTarget);
    const amount = String(form.get("amount") ?? "").trim().replace(",", ".");
    const chosenCurrency = String(form.get("currency") ?? "GBP");
    const scope = String(form.get("scope") ?? "shared");
    try {
      window.localStorage.setItem(CURRENCY_KEY, chosenCurrency);
    } catch {
      /* storage can be unavailable; the default still works */
    }
    const body: Record<string, unknown> = {
      workflowKind: kind,
      amount,
      currency: chosenCurrency,
      vendor: String(form.get("vendor") ?? "").trim() || null,
      taxAmount: String(form.get("taxAmount") ?? "").trim() || null,
      taxInclusion: String(form.get("taxInclusion") ?? "") || null,
      vatRecoverable: form.get("vatRecoverable") === "yes" ? true : form.get("vatRecoverable") === "no" ? false : null,
      dueOn: String(form.get("dueOn") ?? "") || null,
      paidOn: String(form.get("paidOn") ?? "") || null,
      serviceOn: String(form.get("serviceOn") ?? "") || null,
    };
    if (kind === "expense") body.category = String(form.get("category") ?? "");

    const finish = (message: string) => {
      setPending(null);
      toast(message);
      close();
      router.refresh();
    };

    const draft = await businessPost("/api/business-os/finance/drafts", body);
    if (!draft.ok) {
      setPending(null);
      setError(explainFinanceError(draft.payload));
      return;
    }
    const expenseId = resultRecord(draft.payload)?.expense_id;
    if (typeof expenseId !== "string") {
      setPending(null);
      setError("The draft was saved but not returned. Refresh to see it.");
      return;
    }
    if (!post) return finish("Draft saved");
    const posted = await businessPost("/api/business-os/finance/drafts/post", { expenseId });
    if (!posted.ok) {
      toast(`Draft saved, not posted: ${explainFinanceError(posted.payload)}`, "bad");
      setPending(null);
      close();
      router.refresh();
      return;
    }
    if (scope !== "shared") {
      const allocated = await businessPost("/api/business-os/finance/allocations", {
        expenseId,
        currency: chosenCurrency,
        allocations: [{ projectSlug: scope, amount }],
      });
      if (!allocated.ok) {
        toast(`Posted, allocation failed: ${explainFinanceError(allocated.payload)}. Allocate it from the expense.`, "bad");
        setPending(null);
        close();
        router.refresh();
        return;
      }
    }
    finish(kind === "expense" ? "Expense posted" : "Income posted");
  }

  if (categories === null) return <Notice tone="warn">Expense categories are unavailable, so new entries cannot be saved right now.</Notice>;

  return (
    <form onSubmit={submit} className="bos-form" noValidate={false}>
      <div className="bos-seg self-start" role="radiogroup" aria-label="Kind">
        {(
          [
            ["expense", "Expense"],
            ["manual_income", "Income"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={kind === value} className="bos-seg__item" onClick={() => setKind(value)}>
            {label}
          </button>
        ))}
      </div>
      <Field label="Amount" htmlFor="entry-amount">
        <MoneyInput id="entry-amount" name="amount" currencies={CURRENCIES} currency={currency} required autoFocus />
      </Field>
      <div className="bos-form__grid" data-cols="2">
        <Field label="Project" htmlFor="entry-scope" hint="Shared costs can be split later.">
          <Select id="entry-scope" name="scope" defaultValue={defaultProject ?? "shared"}>
            <option value="shared">Shared</option>
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        {kind === "expense" ? (
          <Field label="Category" htmlFor="entry-category">
            <Select id="entry-category" name="category" required={categories.length > 0} defaultValue="">
              <option value="">{categories.length === 0 ? "No category configured" : "Choose a category"}</option>
              {categories.map((category) => (
                <option key={category.code} value={category.code}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
      </div>
      <Field label="Service date" htmlFor="entry-service">
        <DateField id="entry-service" name="serviceOn" defaultValue={today()} />
      </Field>
      <Button variant="ghost" size="sm" className="self-start !px-1" aria-expanded={more} onClick={() => setMore((value) => !value)}>
        <ChevronDownIcon size={16} style={{ transform: more ? "rotate(180deg)" : undefined }} />
        Vendor, tax and payment dates
      </Button>
      {more ? (
        <div className="bos-form__grid" data-cols="2">
          <Field label="Vendor" htmlFor="entry-vendor" className="sm:col-span-2">
            <Input id="entry-vendor" name="vendor" autoComplete="organization" />
          </Field>
          <Field label="Tax amount" htmlFor="entry-tax">
            <Input id="entry-tax" name="taxAmount" inputMode="decimal" className="bos-money" placeholder="0.00" />
          </Field>
          <Field label="Tax" htmlFor="entry-tax-inclusion">
            <Select id="entry-tax-inclusion" name="taxInclusion">
              <option value="">Unspecified</option>
              <option value="exclusive">Added on top</option>
              <option value="inclusive">Included in amount</option>
              <option value="unknown">Unknown</option>
            </Select>
          </Field>
          <Field label="VAT recoverable" htmlFor="entry-vat">
            <Select id="entry-vat" name="vatRecoverable">
              <option value="">Unspecified</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Due on" htmlFor="entry-due">
            <DateField id="entry-due" name="dueOn" placeholder="No due date" />
          </Field>
          <Field label="Paid on" htmlFor="entry-paid">
            <DateField id="entry-paid" name="paidOn" placeholder="Not paid yet" />
          </Field>
        </div>
      ) : null}
      {error ? <Notice tone="bad">{error}</Notice> : null}
      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        <Button type="submit" value="draft" disabled={pending !== null}>
          {pending === "draft" ? "Saving…" : "Save draft"}
        </Button>
        <Button type="submit" value="post" variant="primary" disabled={pending !== null}>
          {pending === "post" ? "Posting…" : "Save and post"}
        </Button>
      </div>
    </form>
  );
}
