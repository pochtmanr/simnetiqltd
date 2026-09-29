"use client";

import { useState, type FormEvent } from "react";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";

const fieldClass = "min-h-11 rounded-md border border-border bg-surface px-3 text-base";

export function ExpenseActions({
  expense,
  projects,
}: {
  expense: {
    id: string;
    currency: string | null;
    amount: string | null;
    vendor: string | null;
    status: string;
    postedEntryId: string | null;
    workflowKind: string;
  };
  projects: { slug: string; name: string }[];
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await businessPost("/api/business-os/finance/drafts/update", {
      expenseId: expense.id,
      amount: String(form.get("amount") ?? "").trim(),
      currency: expense.currency,
      vendor: String(form.get("vendor") ?? ""),
    });
    setMessage(result.ok ? "Draft updated." : explainFinanceError(result.payload));
    if (result.ok) window.location.reload();
  }

  async function post() {
    const result = await businessPost("/api/business-os/finance/drafts/post", { expenseId: expense.id });
    setMessage(result.ok ? "Posted." : explainFinanceError(result.payload));
    if (result.ok) window.location.reload();
  }

  async function reverse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expense.postedEntryId) return;
    const form = new FormData(event.currentTarget);
    const result = await businessPost("/api/business-os/finance/entries/reverse", {
      entryId: expense.postedEntryId,
      reason: String(form.get("reason") ?? ""),
    });
    setMessage(result.ok ? "Reversal recorded." : explainFinanceError(result.payload));
    if (result.ok) window.location.reload();
  }

  async function allocate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expense.currency) return;
    const form = new FormData(event.currentTarget);
    const allocations = projects.flatMap((project) => {
      const amount = String(form.get(project.slug) ?? "").trim();
      return amount ? [{ projectSlug: project.slug, amount }] : [];
    });
    const result = await businessPost("/api/business-os/finance/allocations", {
      expenseId: expense.id,
      currency: expense.currency,
      allocations,
    });
    setMessage(result.ok ? "Allocation saved." : explainFinanceError(result.payload));
    if (result.ok) window.location.reload();
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {expense.status === "draft" ? (
        <>
          <form onSubmit={update} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Amount
              <input name="amount" required defaultValue={expense.amount ?? ""} inputMode="decimal" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Vendor
              <input name="vendor" defaultValue={expense.vendor ?? ""} className={fieldClass} />
            </label>
            <button type="submit" className="min-h-11 rounded-md border border-border px-3 text-sm">
              Update draft
            </button>
          </form>
          <button type="button" onClick={post} className="min-h-11 w-fit rounded-md bg-primary px-3 text-sm text-white">
            Post
          </button>
        </>
      ) : null}
      {expense.status === "posted" && expense.postedEntryId ? (
        <form onSubmit={reverse} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            Correction reason
            <input name="reason" required className={fieldClass} />
          </label>
          <button type="submit" className="min-h-11 rounded-md border border-border px-3 text-sm">
            Reverse
          </button>
        </form>
      ) : null}
      {expense.status === "posted" && expense.workflowKind === "expense" ? (
        <form onSubmit={allocate} className="flex flex-col gap-2">
          <p className="text-sm">Shared allocation amounts</p>
          {projects.map((project) => (
            <label key={project.slug} className="flex flex-col gap-1 text-sm">
              {project.name}
              <input name={project.slug} inputMode="decimal" className={fieldClass} />
            </label>
          ))}
          <button type="submit" className="min-h-11 w-fit rounded-md border border-border px-3 text-sm">
            Save allocation
          </button>
        </form>
      ) : null}
      {message ? <p className="text-sm text-text-dim">{message}</p> : null}
    </div>
  );
}
