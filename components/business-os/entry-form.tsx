"use client";

import { useState, type FormEvent } from "react";
import { businessPost, explainFinanceError, resultRecord } from "@/components/business-os/business-post";

const fieldClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-base";

export function EntryForm({
  projects,
  categories,
  canWrite,
}: {
  projects: { slug: string; name: string }[];
  categories: { code: string; name: string }[] | null;
  canWrite: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWrite) return;
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const workflow = String(form.get("workflow") ?? "expense");
    const amount = String(form.get("amount") ?? "").trim();
    const currency = String(form.get("currency") ?? "").trim().toUpperCase();
    const scope = String(form.get("scope") ?? "shared");
    const category = String(form.get("category") ?? "");
    const serviceOn = String(form.get("serviceOn") ?? "");
    const body: Record<string, unknown> = {
      workflowKind: workflow,
      amount,
      currency,
      vendor: String(form.get("vendor") ?? "") || null,
      taxAmount: String(form.get("taxAmount") ?? "").trim() || null,
      taxInclusion: String(form.get("taxInclusion") ?? "") || null,
      vatRecoverable: form.get("vatRecoverable") === "yes" ? true : form.get("vatRecoverable") === "no" ? false : null,
      dueOn: String(form.get("dueOn") ?? "") || null,
      paidOn: String(form.get("paidOn") ?? "") || null,
      serviceOn: serviceOn || null,
    };
    if (workflow === "expense") body.category = category;
    const draft = await businessPost("/api/business-os/finance/drafts", body);
    if (!draft.ok) {
      setMessage(explainFinanceError(draft.payload));
      setPending(false);
      return;
    }
    const expenseId = resultRecord(draft.payload)?.expense_id;
    if (typeof expenseId !== "string") {
      setMessage("The draft was not returned.");
      setPending(false);
      return;
    }
    if (form.get("post") !== "yes") {
      setMessage("Draft saved.");
      setPending(false);
      window.location.reload();
      return;
    }
    const posted = await businessPost("/api/business-os/finance/drafts/post", { expenseId });
    if (!posted.ok) {
      setMessage(`Draft saved. Posting failed: ${explainFinanceError(posted.payload)}`);
      setPending(false);
      return;
    }
    if (scope !== "shared") {
      const allocated = await businessPost("/api/business-os/finance/allocations", {
        expenseId,
        currency,
        allocations: [{ projectSlug: scope, amount }],
      });
      if (!allocated.ok) {
        setMessage(`Posted. Allocation failed: ${explainFinanceError(allocated.payload)}`);
        setPending(false);
        return;
      }
    }
    window.location.reload();
  }

  if (!canWrite) return <p className="text-sm text-text-dim">This membership is read-only. Drafts stay closed.</p>;
  if (categories === null) return <p className="text-sm text-text-dim">Expense categories are unavailable.</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Kind
        <select name="workflow" className={fieldClass}>
          <option value="expense">Expense</option>
          <option value="manual_income">Manual income</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Amount
        <input name="amount" required inputMode="decimal" autoComplete="off" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Currency
        <input name="currency" required maxLength={3} autoComplete="off" className={`${fieldClass} uppercase`} placeholder="GBP" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Project or shared
        <select name="scope" className={fieldClass}>
          <option value="shared">Shared</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <select name="category" className={fieldClass} required={categories.length > 0}>
          {categories.length === 0 ? <option value="">No category configured</option> : null}
          {categories.map((category) => (
            <option key={category.code} value={category.code}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Service date
        <input name="serviceOn" type="date" className={fieldClass} />
      </label>
      <details className="text-sm">
        <summary className="cursor-pointer">Vendor, tax, and dates</summary>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            Vendor
            <input name="vendor" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1">
            Tax amount
            <input name="taxAmount" inputMode="decimal" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1">
            Tax inclusion
            <select name="taxInclusion" className={fieldClass}>
              <option value="">Unspecified</option>
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            VAT recoverable
            <select name="vatRecoverable" className={fieldClass}>
              <option value="">Unspecified</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Due on
            <input name="dueOn" type="date" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1">
            Paid on
            <input name="paidOn" type="date" className={fieldClass} />
          </label>
        </div>
      </details>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="post" value="yes" />
        Post after saving
      </label>
      <button type="submit" disabled={pending} className="min-h-11 w-fit rounded-md bg-primary px-4 text-sm text-white">
        {pending ? "Saving" : "Save draft"}
      </button>
      {message ? <p className="text-sm text-text-dim">{message}</p> : null}
    </form>
  );
}
