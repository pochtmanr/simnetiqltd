"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Amount } from "@/components/business-os/admin/parts";
import { businessPost, explainFinanceError } from "@/components/business-os/business-post";
import { DataTable, type TableColumn } from "@/components/business-os/ui/data-table";
import { ExpenseIcon, SalesIcon } from "@/components/business-os/ui/icons";
import { Sheet, useToast } from "@/components/business-os/ui/overlay";
import { Button, EmptyState, Field, Input, KeyValues, MoneyInput, Notice, StatusPill } from "@/components/business-os/ui/primitives";
import { formatDate, formatDateTime, formatShortDate, humanize } from "@/lib/business-os/workspace/format";
import type { ExpenseRow, ObservationRow } from "@/lib/business-os/workspace/load";

type Projects = { slug: string; name: string }[];

/* ---------- Sales ---------- */

export function SalesTable({ rows, projects }: { rows: ObservationRow[]; projects: Projects }) {
  const [open, setOpen] = useState<ObservationRow | null>(null);
  const name = (slug: string | null) => projects.find((project) => project.slug === slug)?.name ?? slug ?? "Unknown project";
  const columns = useMemo<TableColumn<ObservationRow>[]>(
    () => [
      { id: "date", header: "Date", cell: (row) => formatDateTime(row.occurredAt), sortValue: (row) => row.occurredAt },
      { id: "type", header: "Type", cell: (row) => humanize(row.recordType), sortValue: (row) => row.recordType },
      { id: "project", header: "Project", cell: (row) => name(row.projectSlug), sortValue: (row) => row.projectSlug },
      { id: "channel", header: "Channel", cell: (row) => humanize(row.store ?? row.channel ?? row.source) || "—", sortValue: (row) => row.store ?? row.channel, wide: true },
      { id: "status", header: "Status", cell: (row) => <StatusPill status={row.quality === "actual" ? row.status : row.quality} label={row.quality === "actual" ? humanize(row.status) : undefined} /> },
      { id: "amount", header: "Amount", align: "end", cell: (row) => <Amount amount={row.amount} currency={row.currency} />, sortValue: (row) => (row.amount === null ? null : Number(row.amount)) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects],
  );
  return (
    <>
      <DataTable
        label="Sales and transactions"
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        initialSort={{ id: "date", desc: true }}
        onRowClick={setOpen}
        mobileRow={(row) => ({
          title: humanize(row.recordType),
          amount: <Amount amount={row.amount} currency={row.currency} />,
          caption: `${formatShortDate(row.occurredAt)} · ${name(row.projectSlug)}`,
          badge: row.quality !== "actual" ? <StatusPill status={row.quality} /> : null,
        })}
        empty={
          <EmptyState icon={<SalesIcon />} title="No observations in this window.">
            Sales appear here once a source has synced finance records for this period.
          </EmptyState>
        }
      />
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? humanize(open.recordType) : ""}>
        {open ? (
          <div className="flex flex-col gap-6">
            <p className="bos-kpi__value">
              <Amount amount={open.amount} currency={open.currency} />
            </p>
            {open.amountReason ? <Notice>{humanize(open.amountReason)}</Notice> : null}
            <KeyValues
              rows={[
                ["Occurred", formatDateTime(open.occurredAt)],
                ["Project", name(open.projectSlug)],
                ["Status", humanize(open.status)],
                ["Quality", humanize(open.quality)],
                ["Source", humanize(open.source) || "Unspecified"],
                ["Channel", humanize(open.channel) || "Unspecified"],
                ["Store", humanize(open.store) || "Unspecified"],
                ["Processor", humanize(open.processor) || "Unspecified"],
                ["Posting role", humanize(open.postingRole)],
                ["Revision", `${open.revision}${open.supersedesRevision ? ` (replaces ${open.supersedesRevision})` : ""}`],
                ["Formula", <span key="f" className="bos-mono">{open.formulaVersion}</span>],
              ]}
            />
            {open.components.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="bos-h3">Components</h3>
                <div className="bos-card overflow-hidden">
                  <table className="bos-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th data-align="end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {open.components.map((component) => (
                        <tr key={component.componentId}>
                          <td>
                            {humanize(component.componentType)}
                            <span className="bos-caption block">
                              {humanize(component.quality)} · {humanize(component.postingRole)}
                              {component.reason ? ` · ${humanize(component.reason)}` : ""}
                            </span>
                          </td>
                          <td data-align="end">
                            <Amount amount={component.amount} currency={component.currency} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

/* ---------- Drill ---------- */

export function DrillTable({ records }: { records: Record<string, unknown>[] }) {
  const columns = useMemo<TableColumn<Record<string, unknown>>[]>(
    () => [
      { id: "type", header: "Record", cell: (row) => humanize(String(row.record_type ?? "record")), sortValue: (row) => String(row.record_type ?? "") },
      { id: "revision", header: "Revision", cell: (row) => String(row.revision ?? "—"), wide: true },
      { id: "formula", header: "Formula", cell: (row) => <span className="bos-mono">{String(row.formula_version ?? "—")}</span>, wide: true },
      {
        id: "amount",
        header: "Amount",
        align: "end",
        cell: (row) => <Amount amount={typeof row.original_amount === "string" ? row.original_amount : null} currency={typeof row.original_currency === "string" ? row.original_currency : null} />,
        sortValue: (row) => (typeof row.original_amount === "string" ? Number(row.original_amount) : null),
      },
    ],
    [],
  );
  return (
    <DataTable
      label="Drill-through records"
      rows={records}
      columns={columns}
      rowKey={(row) => String(row.observation_id ?? JSON.stringify(row))}
      mobileRow={(row) => ({
        title: humanize(String(row.record_type ?? "record")),
        amount: <Amount amount={typeof row.original_amount === "string" ? row.original_amount : null} currency={typeof row.original_currency === "string" ? row.original_currency : null} />,
        caption: `Revision ${String(row.revision ?? "—")}`,
      })}
      empty={<EmptyState title="No drill records for this metric." />}
    />
  );
}

/* ---------- Expenses ---------- */

export function ExpensesTable({ rows, projects, canWrite }: { rows: ExpenseRow[]; projects: Projects; canWrite: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((row) => row.id === openId) ?? null;
  const projectName = (slug: string | null) => projects.find((project) => project.slug === slug)?.name ?? slug;
  const owner = (row: ExpenseRow) => (row.sourceOwner === "simnetiq" ? (projectName(row.projectSlug) ?? "Shared") : (projectName(row.projectSlug) ?? "Source project"));
  const date = (row: ExpenseRow) => row.serviceOn ?? row.paidOn ?? row.dueOn;
  const columns = useMemo<TableColumn<ExpenseRow>[]>(
    () => [
      { id: "date", header: "Date", cell: (row) => formatDate(date(row)), sortValue: (row) => date(row) },
      { id: "vendor", header: "Vendor", cell: (row) => row.vendor ?? <span className="text-[var(--color-text-dim)]">No vendor</span>, sortValue: (row) => row.vendor },
      { id: "kind", header: "Kind", cell: (row) => humanize(row.workflowKind), wide: true },
      { id: "owner", header: "Project", cell: (row) => owner(row), sortValue: (row) => owner(row) },
      { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
      { id: "amount", header: "Amount", align: "end", cell: (row) => <Amount amount={row.amount} currency={row.currency} />, sortValue: (row) => (row.amount === null ? null : Number(row.amount)) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects],
  );
  return (
    <>
      <DataTable
        label="Expenses"
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        initialSort={{ id: "date", desc: true }}
        onRowClick={(row) => setOpenId(row.id)}
        mobileRow={(row) => ({
          title: row.vendor ?? humanize(row.workflowKind),
          amount: <Amount amount={row.amount} currency={row.currency} />,
          caption: `${formatShortDate(date(row))} · ${owner(row)}`,
          badge: <StatusPill status={row.status} />,
        })}
        empty={
          <EmptyState icon={<ExpenseIcon />} title="No expenses match these filters.">
            Add one with New, or clear the filters.
          </EmptyState>
        }
      />
      <Sheet open={open !== null} onClose={() => setOpenId(null)} title={open?.vendor ?? (open ? humanize(open.workflowKind) : "")}>
        {open ? <ExpenseDetail expense={open} projects={projects} canWrite={canWrite} onDone={() => setOpenId(null)} /> : null}
      </Sheet>
    </>
  );
}

function ExpenseDetail({ expense, projects, canWrite, onDone }: { expense: ExpenseRow; projects: Projects; canWrite: boolean; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="bos-kpi__value">
          <Amount amount={expense.amount} currency={expense.currency} />
        </p>
        <StatusPill status={expense.status} />
      </div>
      <KeyValues
        rows={[
          ["Kind", humanize(expense.workflowKind)],
          ["Owner", expense.sourceOwner === "simnetiq" ? "Central" : (expense.projectSlug ?? "Source project")],
          ["Service date", formatDate(expense.serviceOn, "Unset")],
          ["Due", formatDate(expense.dueOn, "Unset")],
          ["Paid", formatDate(expense.paidOn, "Unset")],
          ["Tax", expense.taxAmount === null ? "—" : <Amount key="t" amount={expense.taxAmount} currency={expense.currency} />],
        ]}
      />
      {expense.allocations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="bos-h3">Allocation</h3>
          <KeyValues rows={expense.allocations.map((allocation) => [projects.find((project) => project.slug === allocation.projectSlug)?.name ?? allocation.projectSlug ?? "Project", <Amount key={allocation.id} amount={allocation.amount} currency={expense.currency} />])} />
        </div>
      ) : null}
      {expense.sourceOwner === "project" ? (
        <Notice>Edited in the source project. This workspace does not change source-owned expenses.</Notice>
      ) : canWrite ? (
        <ExpenseActionsPanel expense={expense} projects={projects} onDone={onDone} />
      ) : (
        <Notice>View-only membership. Ask an owner to change this expense.</Notice>
      )}
    </div>
  );
}

function ExpenseActionsPanel({ expense, projects, onDone }: { expense: ExpenseRow; projects: Projects; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState<"post" | "reverse" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [split, setSplit] = useState<Record<string, string>>({});
  const amountText = expense.amount ?? "";

  async function run(path: string, body: Record<string, unknown>, success: string) {
    setPending(true);
    setError(null);
    const result = await businessPost(path, body);
    setPending(false);
    if (!result.ok) {
      setError(explainFinanceError(result.payload));
      return false;
    }
    toast(success);
    setConfirm(null);
    onDone();
    router.refresh();
    return true;
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(
      "/api/business-os/finance/drafts/update",
      { expenseId: expense.id, amount: String(form.get("amount") ?? "").trim().replace(",", "."), currency: expense.currency, vendor: String(form.get("vendor") ?? "") },
      "Draft updated",
    );
  }

  async function reverse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expense.postedEntryId) return;
    const form = new FormData(event.currentTarget);
    await run("/api/business-os/finance/entries/reverse", { entryId: expense.postedEntryId, reason: String(form.get("reason") ?? "") }, "Reversal recorded");
  }

  const allocated = Object.values(split).reduce((sum, value) => sum + (Number(value.replace(",", ".")) || 0), 0);
  const total = Number(amountText) || 0;
  const remaining = Math.round((total - allocated) * 100) / 100;

  async function allocate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expense.currency) return;
    const allocations = Object.entries(split).flatMap(([projectSlug, amount]) => (amount.trim() ? [{ projectSlug, amount: amount.trim().replace(",", ".") }] : []));
    await run("/api/business-os/finance/allocations", { expenseId: expense.id, currency: expense.currency, allocations }, "Allocation saved");
  }

  function splitEvenly() {
    if (!total || projects.length === 0) return;
    const cents = Math.round(total * 100);
    const share = Math.floor(cents / projects.length);
    const next: Record<string, string> = {};
    projects.forEach((project, index) => {
      const value = index === projects.length - 1 ? cents - share * (projects.length - 1) : share;
      next[project.slug] = (value / 100).toFixed(2);
    });
    setSplit(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <Notice tone="bad">{error}</Notice> : null}
      {expense.status === "draft" ? (
        <form onSubmit={update} className="bos-form">
          <h3 className="bos-h3">Edit draft</h3>
          <Field label="Amount" htmlFor="draft-amount">
            <MoneyInput id="draft-amount" name="amount" currency={expense.currency ?? undefined} defaultValue={amountText} required />
          </Field>
          <Field label="Vendor" htmlFor="draft-vendor">
            <Input id="draft-vendor" name="vendor" defaultValue={expense.vendor ?? ""} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" disabled={pending}>
              Save changes
            </Button>
            <Button variant="primary" onClick={() => setConfirm("post")} disabled={pending}>
              Post
            </Button>
          </div>
        </form>
      ) : null}
      {expense.status === "posted" && expense.workflowKind === "expense" ? (
        <form onSubmit={allocate} className="bos-form">
          <div className="flex items-center justify-between gap-2">
            <h3 className="bos-h3">Shared allocation</h3>
            <Button size="sm" variant="ghost" onClick={splitEvenly}>
              Split evenly
            </Button>
          </div>
          {projects.map((project) => (
            <Field key={project.slug} label={project.name} htmlFor={`alloc-${project.slug}`}>
              <div className="bos-affix">
                <span className="bos-affix__text">{expense.currency ?? "—"}</span>
                <input
                  id={`alloc-${project.slug}`}
                  className="bos-input bos-money"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={split[project.slug] ?? ""}
                  onChange={(event) => setSplit((current) => ({ ...current, [project.slug]: event.target.value }))}
                />
              </div>
            </Field>
          ))}
          <p className="bos-caption" aria-live="polite" data-tone={remaining < 0 ? "bad" : undefined}>
            {remaining === 0 ? "Fully allocated." : remaining > 0 ? `${remaining.toFixed(2)} ${expense.currency ?? ""} left to allocate.` : `${Math.abs(remaining).toFixed(2)} ${expense.currency ?? ""} over the expense amount.`}
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || allocated === 0 || remaining < 0}>
              Save allocation
            </Button>
          </div>
        </form>
      ) : null}
      {expense.status === "posted" && expense.postedEntryId ? (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
          <h3 className="bos-h3">Correct a mistake</h3>
          <p className="bos-caption">Posted entries are never edited. Reversing adds an opposite entry with your reason.</p>
          <Button variant="danger" className="self-start" onClick={() => setConfirm("reverse")}>
            Reverse…
          </Button>
        </div>
      ) : null}

      <Sheet open={confirm === "post"} onClose={() => setConfirm(null)} title="Post this expense?" kind="dialog">
        <div className="flex flex-col gap-4">
          <p className="bos-body">
            Post <Amount amount={expense.amount} currency={expense.currency} className="font-semibold" />? Posted entries can only be reversed, not edited.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" disabled={pending} onClick={() => run("/api/business-os/finance/drafts/post", { expenseId: expense.id }, "Posted")}>
              {pending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </Sheet>
      <Sheet open={confirm === "reverse"} onClose={() => setConfirm(null)} title="Reverse this entry?" kind="dialog">
        <form onSubmit={reverse} className="bos-form">
          <Field label="Correction reason" htmlFor="reverse-reason" hint="Kept on the ledger next to the reversal.">
            <Input id="reverse-reason" name="reason" required autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Reversing…" : <>Reverse <Amount amount={expense.amount} currency={expense.currency} /></>}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

/* ---------- Generic dataset rows ---------- */

export function GenericTable({ columns, rows, label }: { columns: string[]; rows: Record<string, string>[]; label: string }) {
  const defs = useMemo<TableColumn<Record<string, string>>[]>(
    () =>
      columns.map((key) => ({
        id: key,
        header: humanize(key),
        cell: (row) => row[key],
        sortValue: (row) => {
          const value = row[key];
          return value !== undefined && value !== "—" && Number.isFinite(Number(value)) ? Number(value) : value;
        },
        align: rows.every((row) => row[key] === "—" || Number.isFinite(Number(row[key]))) ? ("end" as const) : undefined,
      })),
    [columns, rows],
  );
  const keyed = useMemo<Record<string, string>[]>(() => rows.map((row, index) => ({ ...row, __key: String(index) })), [rows]);
  return (
    <DataTable
      label={label}
      rows={keyed}
      columns={defs}
      rowKey={(row) => row.__key}
      pageSize={20}
      mobileRow={(row) => ({
        title: row[columns[0] ?? ""] ?? "Row",
        amount: columns[1] ? row[columns[1]] : undefined,
        caption: columns
          .slice(2, 5)
          .map((key) => `${humanize(key)} ${row[key]}`)
          .join(" · "),
      })}
      empty={<EmptyState title="No rows in this snapshot." />}
    />
  );
}
