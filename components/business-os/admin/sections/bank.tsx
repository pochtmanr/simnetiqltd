import { BankRules, BankTransactionsTable, RevolutConnect } from "@/components/business-os/admin/bank-client";
import { Amount, KpiCard } from "@/components/business-os/admin/parts";
import { SeriesChart } from "@/components/business-os/ui/charts";
import { CashIcon } from "@/components/business-os/ui/icons";
import { Card, CardHead, EmptyState, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { BANK_TRANSACTION_LIMIT, type BankData } from "@/lib/business-os/bank/load";
import { cashflow, dailyFlow, type CurrencyFlow } from "@/lib/business-os/bank/summary";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { formatDateTime, formatShortDate, groupDigits, humanize, periodLabel } from "@/lib/business-os/workspace/format";
import type { MoneyMetric } from "@/lib/business-os/workspace/present";

/** A bank figure is an actual amount straight from the bank. */
const actual = (amount: string, currency: string): MoneyMetric => ({ amount, currency, quality: "actual", reason: null, coverage: null });

/** What the redirect back from Revolut means, keyed by the `revolut` query value. */
const CALLBACK_NOTICE: Record<string, { tone: "ok" | "warn" | "bad"; text: string }> = {
  connected: { tone: "ok", text: "Revolut is connected and the first pull is in." },
  declined: { tone: "warn", text: "The connection was declined in Revolut. Nothing was changed." },
  state_mismatch: { tone: "bad", text: "The connection link expired or was opened in another browser. Start again from Connect." },
  owner_required: { tone: "bad", text: "Only the owner can connect the bank. Sign in as the owner and try again." },
  exchange_failed: { tone: "bad", text: "Revolut refused the sign-in code. Check REVOLUT_CLIENT_ID, the private key and the redirect URI, then try again." },
  save_failed: { tone: "bad", text: "The connection could not be saved. Try again." },
  revolut_unconfigured: { tone: "bad", text: "Revolut is not configured on the server." },
  token_key_missing: { tone: "bad", text: "BUSINESS_OS_TOKEN_KEY is missing or not 32 bytes, so the token cannot be stored safely." },
};

function callbackNotice(code: string | null) {
  if (!code) return null;
  if (CALLBACK_NOTICE[code]) return CALLBACK_NOTICE[code];
  if (code.startsWith("connected_")) return { tone: "warn" as const, text: `Revolut is connected, but the first pull ended with “${humanize(code.slice("connected_".length)).toLowerCase()}”. The next scheduled pull will retry.` };
  return { tone: "bad" as const, text: `Connecting Revolut failed (${humanize(code).toLowerCase()}).` };
}

function runLine(data: BankData): string {
  if (!data.lastRun) return "Not pulled yet";
  const when = formatDateTime(data.lastRun.finishedAt);
  return data.lastRun.outcome === "committed" ? `Last pull ${when} · ${groupDigits(String(data.lastRun.rows))} rows` : `Last pull ${when} · ${humanize(data.lastRun.outcome)}`;
}

export function Bank({ query, data, canWrite, isOwner, notice }: { query: WorkspaceQuery; data: BankData | { error: string } | undefined; canWrite: boolean; isOwner: boolean; notice: string | null }) {
  if (!data || "error" in data) return <Notice tone="bad">Bank data is unavailable{data && "error" in data ? ` (${humanize(data.error).toLowerCase()})` : ""}.</Notice>;
  const flows = cashflow(data.transactions);
  const shown = callbackNotice(notice);
  const connected = data.connectedAt !== null;
  const needsReconnect = connected && data.lastRun?.outcome === "reconnect_required";

  return (
    <div className="flex flex-col gap-8">
      {shown ? <Notice tone={shown.tone}>{shown.text}</Notice> : null}

      <Card>
        <CardHead
          title={
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand mark */}
              <img src="/logos/brands/revolut.svg" alt="" width={18} height={18} className="bos-hub-provider-logo bos-hub-brand--dark" />
              Revolut Business
              {needsReconnect ? (
                <StatusPill tone="bad" label="Reconnect needed" compact />
              ) : connected ? (
                <StatusPill tone="ok" label="Connected" compact />
              ) : (
                <StatusPill tone="muted" label="Not connected" compact />
              )}
            </span>
          }
          meta={connected ? `Connected ${formatDateTime(data.connectedAt)} · ${runLine(data)} · pulled every 30 minutes` : "Read-only access to balances and transactions. Nothing here can move money."}
          actions={isOwner && data.configured ? <RevolutConnect connected={connected && !needsReconnect} label={needsReconnect ? "Reconnect" : "Connect Revolut"} /> : null}
        />
        {!data.configured ? (
          <div className="p-4 md:p-5">
            <Notice tone="warn">
              Revolut is not configured yet. Set REVOLUT_CLIENT_ID, REVOLUT_PRIVATE_KEY, REVOLUT_REDIRECT_URI and BUSINESS_OS_TOKEN_KEY (steps in docs/BUSINESS_OS_INTEGRATIONS.md), then connect here.
            </Notice>
          </div>
        ) : !isOwner && !connected ? (
          <div className="p-4 md:p-5">
            <p className="bos-caption">The owner connects the bank.</p>
          </div>
        ) : null}
      </Card>

      {data.accounts.length > 0 ? (
        <Section title="Balances" description={`As of ${formatDateTime(data.accounts[0].asOf)}. Balances are a level, not a flow: they are never added across days.`}>
          <div className="bos-kpis">
            {data.accounts
              .filter((account) => account.state === "active" || Number(account.balance) !== 0)
              .map((account) => (
                <KpiCard key={account.id} label={`${account.name ?? "Account"} · ${account.currency}`} icon={<CashIcon size={16} />} metric={actual(account.balance, account.currency)} />
              ))}
          </div>
        </Section>
      ) : null}

      {connected || data.transactions.length > 0 ? (
        <>
          {flows.length === 0 ? null : (
            <Section title={`Cash flow · ${periodLabel(query)}`} description="Completed transactions only. Own-account transfers and exchanges are shown apart and never count as money in or out.">
              <div className="flex flex-col gap-6">
                {flows.map((flow) => (
                  <CurrencyFlowCard key={flow.currency} flow={flow} daily={dailyFlow(data.transactions, flow.currency)} />
                ))}
              </div>
            </Section>
          )}
          <Section
            title="Transactions"
            description={`${periodLabel(query)} · ${groupDigits(String(data.transactions.length))} rows${data.truncated ? ` · showing the newest ${groupDigits(String(BANK_TRANSACTION_LIMIT))}; pick a shorter period to see the rest` : ""}`}
          >
            <Card className="overflow-hidden p-3 md:p-4">
              <BankTransactionsTable rows={data.transactions} accounts={data.accounts} canWrite={canWrite} />
            </Card>
          </Section>
          <Section title="Category rules" description="Applied to new transactions as they arrive, and to uncategorised ones when a rule is saved. A category you set by hand is never changed by a rule.">
            <Card>
              <BankRules rules={data.rules} canWrite={canWrite} />
            </Card>
          </Section>
        </>
      ) : (
        <Card>
          <EmptyState icon={<CashIcon />} title="No bank data yet">
            Connect Revolut Business to pull balances and the last 400 days of transactions.
          </EmptyState>
        </Card>
      )}
    </div>
  );
}

function CurrencyFlowCard({ flow, daily }: { flow: CurrencyFlow; daily: { day: string; moneyIn: number; moneyOut: number }[] }) {
  return (
    <Card>
      <CardHead
        title={flow.currency}
        meta={flow.uncategorised > 0 ? `${flow.uncategorised} uncategorised transaction${flow.uncategorised === 1 ? "" : "s"}` : "Every transaction is categorised"}
      />
      <div className="bos-kpis p-4 md:p-5" data-flat="">
        <KpiCard label="Money in" metric={actual(flow.moneyIn, flow.currency)} />
        <KpiCard label="Money out" metric={actual(flow.moneyOut, flow.currency)} />
        <KpiCard label="Net" metric={actual(flow.net, flow.currency)} />
        <KpiCard label="Bank fees" metric={actual(flow.fees, flow.currency)} />
      </div>
      {daily.length > 1 ? (
        <div className="px-4 pb-4 md:px-5">
          <SeriesChart
            kind="bar"
            currency={flow.currency}
            height={200}
            data={daily.map((row) => ({ label: formatShortDate(`${row.day}T12:00:00Z`), in: row.moneyIn, out: row.moneyOut }))}
            series={[
              { key: "in", label: "Money in", color: 0 },
              { key: "out", label: "Money out", color: 1 },
            ]}
          />
        </div>
      ) : null}
      <div className="bos-grid-2 border-t border-[var(--color-border)]" data-even="">
        <CategoryList title="Money in by category" rows={flow.inflows} currency={flow.currency} />
        <CategoryList title="Money out by category" rows={flow.outflows} currency={flow.currency} />
      </div>
    </Card>
  );
}

function CategoryList({ title, rows, currency }: { title: string; rows: CurrencyFlow["inflows"]; currency: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 md:p-5">
      <p className="bos-label">{title}</p>
      {rows.length === 0 ? (
        <p className="bos-caption">None in this period.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li key={row.category ?? "none"} className="flex items-baseline justify-between gap-3 text-sm">
              <span className={row.category ? "truncate" : "truncate text-[var(--color-text-dim)]"}>
                {row.label} <span className="bos-caption">· {row.count}</span>
              </span>
              <Amount amount={row.total} currency={currency} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
