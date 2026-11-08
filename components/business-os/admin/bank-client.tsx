"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Amount } from "@/components/business-os/admin/parts";
import { businessPost, explainFinanceError, resultRecord } from "@/components/business-os/business-post";
import { DataTable, type TableColumn } from "@/components/business-os/ui/data-table";
import { SearchIcon, TrashIcon } from "@/components/business-os/ui/icons";
import { useToast } from "@/components/business-os/ui/overlay";
import { Button, Field, Input, Select, StatusPill } from "@/components/business-os/ui/primitives";
import { BANK_CATEGORIES, bankCategory } from "@/lib/business-os/bank/categories";
import type { BankAccount, BankRule, BankTransaction } from "@/lib/business-os/bank/load";
import { formatShortDate, humanize } from "@/lib/business-os/workspace/format";

/* ---------- Connection ---------- */

export function RevolutConnect({ connected, label }: { connected: boolean; label: string }) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    const started = await businessPost("/api/business-os/providers/revolut/connect", {});
    const url = resultRecord(started.payload)?.url;
    if (!started.ok || typeof url !== "string") {
      setBusy(false);
      toast(explainFinanceError(started.payload), "bad");
      return;
    }
    window.location.href = url;
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Revolut? Transactions already pulled stay; new ones stop arriving until you connect again.")) return;
    setBusy(true);
    const done = await businessPost("/api/business-os/providers/revolut/disconnect", {});
    setBusy(false);
    if (!done.ok) {
      toast(explainFinanceError(done.payload), "bad");
      return;
    }
    toast("Revolut disconnected.");
    router.refresh();
  }

  return connected ? (
    <Button size="sm" variant="ghost" onClick={disconnect} disabled={busy}>
      Disconnect
    </Button>
  ) : (
    <Button size="sm" variant="primary" onClick={connect} disabled={busy}>
      {busy ? "Opening Revolut…" : label}
    </Button>
  );
}

/* ---------- Category picker ---------- */

function CategorySelect({ row, canWrite }: { row: BankTransaction; canWrite: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [value, setValue] = useState(row.category ?? "");
  const known = BANK_CATEGORIES.some((item) => item.slug === value);

  if (!canWrite) return <span>{bankCategory(row.category)?.label ?? <span className="text-[var(--color-text-dim)]">Uncategorised</span>}</span>;

  async function change(next: string) {
    const previous = value;
    setValue(next);
    const saved = await businessPost("/api/business-os/bank/category", { id: row.id, category: next || null });
    if (!saved.ok) {
      setValue(previous);
      toast(explainFinanceError(saved.payload), "bad");
      return;
    }
    router.refresh();
  }

  return (
    <Select
      size="sm"
      aria-label={`Category for ${row.counterparty ?? row.description ?? "transaction"}`}
      value={value}
      onChange={(event) => change(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      title={row.categorySource === "rule" ? "Set by a rule" : row.categorySource === "manual" ? "Set by hand" : undefined}
      data-source={row.categorySource ?? undefined}
    >
      <option value="">Uncategorised</option>
      {!known && value ? <option value={value}>{bankCategory(value)?.label}</option> : null}
      {(["in", "out", "transfer"] as const).map((flow) => (
        <optgroup key={flow} label={flow === "in" ? "Money in" : flow === "out" ? "Money out" : "Transfers"}>
          {BANK_CATEGORIES.filter((item) => item.flow === flow).map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

/* ---------- Transactions ---------- */

const STATE_TONE: Record<string, "ok" | "warn" | "bad" | "muted"> = { completed: "ok", pending: "warn", created: "warn", declined: "bad", failed: "bad", reverted: "bad" };

export function BankTransactionsTable({ rows, accounts, canWrite }: { rows: BankTransaction[]; accounts: BankAccount[]; canWrite: boolean }) {
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const accountName = useMemo(() => new Map(accounts.map((item) => [item.id, item.name ?? item.currency])), [accounts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (account && row.accountId !== account) return false;
      if (category === "__none" ? row.category !== null : category && row.category !== category) return false;
      if (!needle) return true;
      return [row.counterparty, row.description, row.reference, row.amount].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [rows, search, account, category]);

  const columns: TableColumn<BankTransaction>[] = [
    { id: "date", header: "Date", cell: (row) => formatShortDate(row.createdAt), sortValue: (row) => row.createdAt },
    {
      id: "who",
      header: "Counterparty",
      cell: (row) => (
        <span className="flex min-w-0 max-w-[26rem] flex-col">
          <span className="truncate font-medium" title={row.counterparty ?? row.description ?? undefined}>
            {row.counterparty ?? row.description ?? humanize(row.kind)}
          </span>
          {row.counterparty && row.description ? (
            <span className="bos-caption truncate" title={row.description}>
              {row.description}
            </span>
          ) : null}
        </span>
      ),
      sortValue: (row) => (row.counterparty ?? row.description ?? "").toLowerCase(),
    },
    { id: "account", header: "Account", cell: (row) => accountName.get(row.accountId) ?? "—", wide: true },
    { id: "category", header: "Category", cell: (row) => <CategorySelect key={`${row.id}-${row.category}`} row={row} canWrite={canWrite} />, sortValue: (row) => row.category ?? "" },
    {
      id: "state",
      header: "State",
      cell: (row) => (row.state === "completed" ? null : <StatusPill tone={STATE_TONE[row.state] ?? "muted"} label={humanize(row.state)} compact />),
      wide: true,
    },
    { id: "amount", header: "Amount", align: "end", cell: (row) => <Amount amount={row.amount} currency={row.currency} />, sortValue: (row) => Number(row.amount) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="bos-bank-filters">
        <label className="bos-bank-search">
          <SearchIcon size={16} />
          <Input size="sm" type="search" placeholder="Search counterparty, description, amount" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search transactions" />
        </label>
        <Select size="sm" value={account} onChange={(event) => setAccount(event.target.value)} aria-label="Account">
          <option value="">All accounts</option>
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name ?? item.currency} · {item.currency}
            </option>
          ))}
        </Select>
        <Select size="sm" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          <option value="__none">Uncategorised</option>
          {BANK_CATEGORIES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(row) => row.id}
        label="Bank transactions"
        initialSort={{ id: "date", desc: true }}
        pageSize={50}
        empty={rows.length === 0 ? "No transactions in this period." : "Nothing matches these filters."}
        mobileRow={(row) => ({
          title: row.counterparty ?? row.description ?? humanize(row.kind),
          amount: <Amount amount={row.amount} currency={row.currency} />,
          caption: `${formatShortDate(row.createdAt)} · ${bankCategory(row.category)?.label ?? "Uncategorised"}${row.state === "completed" ? "" : ` · ${humanize(row.state)}`}`,
        })}
      />
    </div>
  );
}

/* ---------- Rules ---------- */

export function BankRules({ rules, canWrite }: { rules: BankRule[]; canWrite: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const saved = await businessPost("/api/business-os/bank/rules", { match: String(form.get("match") ?? ""), category: String(form.get("category") ?? "") });
    setBusy(false);
    if (!saved.ok) {
      toast(saved.payload.error === "rule_invalid" ? "A rule needs 2 to 80 characters of text to match." : explainFinanceError(saved.payload), "bad");
      return;
    }
    const applied = Number(resultRecord(saved.payload)?.applied ?? 0);
    toast(applied > 0 ? `Rule saved and applied to ${applied} transaction${applied === 1 ? "" : "s"}.` : "Rule saved.");
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function remove(id: string) {
    const removed = await businessPost("/api/business-os/bank/rules", { delete: id });
    if (!removed.ok) {
      toast(explainFinanceError(removed.payload), "bad");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col">
      {rules.length === 0 ? (
        <p className="bos-caption px-4 py-3 md:px-5">No rules yet. A rule sets the category of every transaction whose counterparty, description or reference contains its text.</p>
      ) : (
        <ul className="bos-rows">
          {rules.map((rule) => (
            <li key={rule.id} className="bos-row">
              <span className="bos-row__main">
                <span className="bos-row__title">“{rule.match}”</span>
                <span className="bos-caption">→ {bankCategory(rule.category)?.label}</span>
              </span>
              {canWrite ? (
                <Button size="sm" variant="ghost" iconOnly aria-label={`Delete rule ${rule.match}`} onClick={() => remove(rule.id)}>
                  <TrashIcon size={16} />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canWrite ? (
        <form onSubmit={add} className="bos-bank-rule-form">
          <Field label="When the text contains" htmlFor="rule-match">
            <Input id="rule-match" name="match" size="sm" required minLength={2} maxLength={80} placeholder="e.g. azure" />
          </Field>
          <Field label="Set category" htmlFor="rule-category">
            <Select id="rule-category" name="category" size="sm" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {BANK_CATEGORIES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" size="sm" disabled={busy}>
            Add rule
          </Button>
        </form>
      ) : null}
    </div>
  );
}
