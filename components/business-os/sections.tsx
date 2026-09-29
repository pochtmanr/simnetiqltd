import { EntryForm } from "@/components/business-os/entry-form";
import { ExpenseActions } from "@/components/business-os/expense-actions";
import { csvHref, workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import {
  attentionItems,
  balancesVerified,
  cashCaption,
  displayAmount,
  filterLabeledRows,
  funnelDenominators,
  operationRows,
  OVERVIEW_METRICS,
  readTrafficReports,
  subscriptionView,
  trafficPresentation,
  type FinancialReportView,
  type MoneyMetric,
  type ReportBucket,
} from "@/lib/business-os/workspace/present";

const PROJECT_METRICS = ["gross_customer_sales", "net_proceeds", "operating_profit"] as const;

const METRIC_LABELS: Record<string, string> = {
  gross_customer_sales: "Sales",
  net_proceeds: "Proceeds",
  direct_costs: "Direct costs",
  operating_expenses: "Operating expenses",
  operating_profit: "Operating profit",
  net_profit: "Net profit",
};

function LaterPanel({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-sm text-text-dim">
        This section is the next step. Document search, the business registry, and the timeline are not available in this workspace yet.
      </p>
    </section>
  );
}

function MoneyValue({
  metric,
  basis,
  windowLabel,
}: {
  metric: MoneyMetric | null;
  basis?: string | null;
  windowLabel?: string | null;
}) {
  const shown = displayAmount(metric);
  return (
    <>
      <p className="text-lg">{shown.text}</p>
      <p className="text-xs text-text-dim">
        {shown.quality}
        {shown.reason ? ` · ${shown.reason}` : ""}
        {metric?.coverage ? ` · ${metric.coverage}` : ""}
        {metric?.currency ? ` · ${metric.currency}` : ""}
        {basis ? ` · ${basis}` : ""}
        {windowLabel ? ` · ${windowLabel}` : ""}
      </p>
    </>
  );
}

function windowLabel(from: string | null, to: string | null): string {
  return `${from ?? "Unavailable"} to ${to ?? "Unavailable"}`;
}

function ReportBlocks({
  report,
  query,
  base,
  verifiedCash,
}: {
  report: FinancialReportView;
  query: WorkspaceQuery;
  base: "/admin" | "/tg";
  verifiedCash: boolean;
}) {
  if (report.buckets.length === 0) return <p className="text-sm text-text-dim">No report bucket for this window.</p>;
  return (
    <div className="flex flex-col gap-6">
      {report.buckets.map((bucket) => (
        <Bucket key={`${bucket.from}-${bucket.to}`} bucket={bucket} query={query} base={base} verifiedCash={verifiedCash} basis={report.basis} />
      ))}
    </div>
  );
}

function Bucket({
  bucket,
  query,
  base,
  verifiedCash,
  basis,
}: {
  bucket: ReportBucket;
  query: WorkspaceQuery;
  base: "/admin" | "/tg";
  verifiedCash: boolean;
  basis: string | null;
}) {
  const period = windowLabel(bucket.from, bucket.to);
  const cardBasis = basis ?? query.basis;
  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-text-dim">
        {period} · {cardBasis} · {bucket.partial ? "partial bucket" : "full bucket"} · Europe/London
      </p>
      {bucket.native.map((block) => (
        <div key={block.currency} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{block.currency}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {OVERVIEW_METRICS.map((metric) => (
              <a
                key={metric}
                href={workspaceHref(base, query, { section: "sales", metric })}
                className="rounded-md border border-border bg-surface px-3 py-3"
              >
                <p className="text-xs text-text-dim">{METRIC_LABELS[metric]}</p>
                <MoneyValue metric={block.metrics[metric] ?? null} basis={cardBasis} windowLabel={period} />
              </a>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-md border border-border px-3 py-3">
        <h3 className="text-sm font-medium">GBP</h3>
        {bucket.gbp.metrics ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {OVERVIEW_METRICS.map((metric) => (
              <a
                key={metric}
                href={workspaceHref(base, query, { section: "sales", metric })}
                className="rounded-md border border-border bg-surface px-3 py-3"
              >
                <p className="text-xs text-text-dim">{METRIC_LABELS[metric]}</p>
                <MoneyValue metric={bucket.gbp.metrics?.[metric] ?? null} basis={cardBasis} windowLabel={period} />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm">Unavailable{bucket.gbp.reason ? ` · ${bucket.gbp.reason}` : ""}</p>
        )}
        {bucket.gbp.policyVersion ? <p className="mt-2 text-xs text-text-dim">Policy {bucket.gbp.policyVersion}</p> : null}
      </div>
      <AllocationView allocation={bucket.allocation} />
      <CashView bucket={bucket} verifiedCash={verifiedCash} />
      <LegacyView legacy={bucket.legacy} />
    </section>
  );
}

function AllocationView({ allocation }: { allocation: Record<string, string | null> }) {
  const rows = [
    ["Before shared allocation", allocation.profit_before],
    ["Shared allocation", allocation.allocation],
    ["After shared allocation", allocation.profit_after],
    ["Company cost", allocation.company_cost],
    ["Unallocated remainder", allocation.unallocated],
  ];
  return (
    <section>
      <h3 className="text-sm font-medium">Shared allocation</h3>
      {allocation.reason ? <p className="text-sm text-text-dim">Reason {allocation.reason}</p> : null}
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {rows.map(([label, amount]) => (
          <div key={label}>
            <dt className="text-text-dim">{label}</dt>
            <dd>{amount === null ? "Unavailable" : `${amount} GBP`}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CashView({ bucket, verifiedCash }: { bucket: ReportBucket; verifiedCash: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Cash and payouts</h3>
      {bucket.cash.balances.length === 0 ? <p className="text-sm text-text-dim">No balance snapshot in this window.</p> : null}
      <ul className="flex flex-col gap-2 text-sm">
        {bucket.cash.balances.map((balance) => (
          <li key={`${balance.snapshotKind}-${balance.asOf}`} className="rounded-md border border-border px-3 py-2">
            <p>{balance.amount === null ? "Unavailable" : `${balance.amount} ${balance.currency ?? ""}`}</p>
            <p className="text-xs text-text-dim">
              {cashCaption(balance.snapshotKind, verifiedCash)} · as of {balance.asOf ?? "unknown"} · not additive
            </p>
          </li>
        ))}
      </ul>
      {bucket.cash.movements.length > 0 ? (
        <ul className="text-sm">
          {bucket.cash.movements.map((movement, index) => (
            <li key={`${movement.kind}-${index}`}>
              {movement.kind}: {movement.amount === null ? "Unavailable" : `${movement.amount} ${movement.currency ?? ""}`} · not revenue
            </li>
          ))}
        </ul>
      ) : null}
      {bucket.cash.residuals.length > 0 ? (
        <p className="text-sm text-text-dim">{bucket.cash.residuals.length} unmatched settlements in this window.</p>
      ) : null}
    </section>
  );
}

function LegacyView({ legacy }: { legacy: ReportBucket["legacy"] }) {
  if (!legacy) return <p className="text-sm text-text-dim">Frozen SMS legacy snapshot is absent for this window.</p>;
  const fields = legacy.preserved;
  return (
    <section className="rounded-md border border-border px-3 py-3 text-sm">
      <h3 className="font-medium">Frozen SMS legacy</h3>
      <p className="text-xs text-text-dim">
        {legacy.formulaVersion ?? "sms-legacy-usd-v1"} · {legacy.currency ?? "USD"} · cash net is proceeds, not bank cash
      </p>
      <dl className="mt-2 grid gap-1">
        <div>Gross {fields?.gross ?? "Unavailable"}</div>
        <div>Apple fee {fields?.apple_fee ?? "Unavailable"}</div>
        <div>Refunds {fields?.refunds ?? "Unavailable"}</div>
        <div>Cash net {fields?.cash_net ?? "Unavailable"}</div>
        <div>Legacy net {legacy.legacyNetAmount ?? "Unavailable"}</div>
        <div>Real spend Unavailable{legacy.realSpendReason ? ` · ${legacy.realSpendReason}` : ""}</div>
      </dl>
      {legacy.warnings.map((warning) => (
        <p key={warning} className="mt-1 text-xs text-text-dim">
          {warning}
        </p>
      ))}
    </section>
  );
}

function salesRows(data: WorkspaceData, query: WorkspaceQuery) {
  if ("error" in data.observations) return data.observations;
  const scoped = data.observations.rows.filter((row) => !query.project || row.projectSlug === query.project);
  return {
    rows: filterLabeledRows(
      scoped.map((row) => ({ ...row, currency: row.currency, source: row.source, status: row.status })),
      query,
    ),
  };
}

export function WorkspaceSection({
  surface,
  base,
  query,
  data,
  canWrite,
}: {
  surface: "admin" | "tg";
  base: "/admin" | "/tg";
  query: WorkspaceQuery;
  data: WorkspaceData;
  canWrite: boolean;
}) {
  const section = query.section;
  if (section === "documents" || section === "records" || section === "timeline") {
    const title = section === "documents" ? "Documents" : section === "records" ? "Business records" : "Timeline";
    return <LaterPanel title={title} />;
  }
  if (section === "more") return <MoreLinks base={base} query={query} />;
  if (section === "add" || section === "expenses") {
    return (
      <div className="flex flex-col gap-6" data-surface={surface}>
        <EntryForm projects={data.projects} categories={"error" in data.categories ? null : data.categories.rows} canWrite={canWrite} />
        {section === "expenses" ? <Expenses data={data} query={query} canWrite={canWrite} /> : null}
      </div>
    );
  }
  if (section === "projects") return <Projects data={data} />;
  if (section === "sales") return <Sales query={query} data={data} />;
  if (section === "subscriptions") return <Subscriptions data={data} />;
  if (section === "traffic") return <Traffic data={data} />;
  if (section === "accounts") return <Accounts data={data} query={query} base={base} />;
  if (section === "reports") return <Reports data={data} query={query} base={base} />;
  if (section === "integrations") return <Integrations data={data} />;
  if (section === "settings") return null;
  if (section === "money") return <Money data={data} query={query} base={base} />;
  return <Overview data={data} query={query} base={base} />;
}

function primaryReport(data: WorkspaceData): { report: FinancialReportView | null; error: string | null } {
  if (data.company.report || data.company.error) return data.company;
  return data.byProject[0] ?? { report: null, error: null };
}

function verifiedFor(data: WorkspaceData, basis: string): boolean {
  if ("error" in data.gates) return false;
  return balancesVerified(data.gates.rows, basis);
}

function ProjectPerformance({ data, query, base }: { data: WorkspaceData; query: WorkspaceQuery; base: "/admin" | "/tg" }) {
  return (
    <section>
      <h3 className="text-sm font-medium">Projects</h3>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {data.byProject.map((project) => {
          const name = data.projects.find((item) => item.slug === project.slug)?.name ?? project.slug;
          const bucket = project.report?.buckets[0];
          const period = bucket ? windowLabel(bucket.from, bucket.to) : null;
          return (
            <li key={project.slug} className="rounded-md border border-border px-3 py-2">
              <a className="font-medium" href={workspaceHref(base, query, { project: project.slug, section: "overview", metric: null })}>
                {name}
              </a>
              {project.error ? <p className="text-text-dim">Report {project.error.replaceAll("_", " ")}.</p> : null}
              {project.report ? <p className="text-text-dim">Coverage {project.report.coverage ?? "unavailable"}</p> : null}
              {bucket?.native.map((block) => (
                <div key={block.currency} className="mt-2">
                  <p className="text-xs text-text-dim">{block.currency}</p>
                  {PROJECT_METRICS.map((metric) => (
                    <div key={metric}>
                      <p className="text-xs text-text-dim">{METRIC_LABELS[metric]}</p>
                      <MoneyValue metric={block.metrics[metric] ?? null} basis={project.report?.basis ?? query.basis} windowLabel={period} />
                    </div>
                  ))}
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SourceFreshness({ data }: { data: WorkspaceData }) {
  const healthRows = "error" in data.health ? null : data.health.rows;
  return (
    <section>
      <h3 className="text-sm font-medium">Source freshness</h3>
      {data.connections.length === 0 ? <p className="mt-2 text-sm text-text-dim">No source connection is registered.</p> : null}
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {data.connections.map((connection) => {
          const health = healthRows?.find((row) => row.connectionId === connection.id);
          const status = health?.status ?? (healthRows ? "unconfigured" : "unavailable");
          return (
            <li key={connection.id}>
              {connection.projectSlug ?? "project"} · {connection.environment} · {status} · {health?.lastSuccessAt ?? "no successful sync"}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Overview({ data, query, base }: { data: WorkspaceData; query: WorkspaceQuery; base: "/admin" | "/tg" }) {
  const primary = primaryReport(data);
  const coverage = primary.report?.coverage ?? null;
  const exclusions = primary.report?.exclusions ?? [];
  const health = "error" in data.health ? [] : data.health.rows;
  const stale = "error" in data.snapshots ? [] : data.snapshots.rows.filter((row) => row.status === "stale").map((row) => row.dataset);
  const unmatched = primary.report?.buckets.reduce((sum, bucket) => sum + bucket.cash.residuals.length, 0) ?? 0;
  const unverified = "error" in data.gates ? 0 : data.gates.rows.filter((gate) => gate.state !== "verified").length;
  const attention = attentionItems({
    coverage,
    exclusions,
    health: health.map((row) => ({ status: row.status, lastErrorCode: row.lastErrorCode })),
    staleDatasets: stale,
    unmatchedCount: unmatched,
    unverifiedGates: "error" in data.gates ? 0 : unverified,
  });
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-lg font-medium">Overview</h2>
        <p className="text-sm text-text-dim">
          {query.from} to {query.to} · {query.basis} · coverage {coverage ?? "unavailable"}
        </p>
      </header>
      {primary.error ? <p className="text-sm text-error">Report {primary.error.replaceAll("_", " ")}.</p> : null}
      {"error" in data.gates ? <p className="text-sm text-text-dim">Dataset gates are unavailable.</p> : null}
      {"error" in data.health ? <p className="text-sm text-text-dim">Source health is unavailable.</p> : null}
      {primary.report ? <ReportBlocks report={primary.report} query={query} base={base} verifiedCash={verifiedFor(data, query.basis)} /> : null}
      <ProjectPerformance data={data} query={query} base={base} />
      <SourceFreshness data={data} />
      <section>
        <h3 className="text-sm font-medium">Attention</h3>
        {attention.length === 0 ? <p className="mt-2 text-sm text-text-dim">No attention items in this window.</p> : null}
        <ul className="mt-2 list-disc pl-5 text-sm">
          {attention.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Money({ data, query, base }: { data: WorkspaceData; query: WorkspaceQuery; base: "/admin" | "/tg" }) {
  return (
    <div className="flex flex-col gap-4">
      <Overview data={data} query={query} base={base} />
      <div className="flex flex-wrap gap-2 text-sm">
        <a className="min-h-11 rounded-md border border-border px-3 py-2" href={workspaceHref(base, query, { section: "sales", metric: null })}>
          Sales
        </a>
        <a className="min-h-11 rounded-md border border-border px-3 py-2" href={workspaceHref(base, query, { section: "expenses", metric: null })}>
          Expenses
        </a>
        <a className="min-h-11 rounded-md border border-border px-3 py-2" href={workspaceHref(base, query, { section: "accounts", metric: null })}>
          Accounts
        </a>
        <a className="min-h-11 rounded-md border border-border px-3 py-2" href={workspaceHref(base, query, { section: "subscriptions", metric: null })}>
          Subscriptions
        </a>
        <a className="min-h-11 rounded-md border border-border px-3 py-2" href={workspaceHref(base, query, { section: "reports", metric: null })}>
          Reports
        </a>
      </div>
    </div>
  );
}

function Projects({ data }: { data: WorkspaceData }) {
  const exclusions = data.company.report?.exclusions ?? data.byProject.flatMap((project) => project.report?.exclusions ?? []);
  return (
    <section>
      <h2 className="text-lg font-medium">Projects</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {data.projects.map((project) => {
          const exclusion = exclusions.find((item) => item.projectSlug === project.slug);
          return (
            <li key={project.id} className="rounded-md border border-border px-3 py-2">
              <p className="font-medium">{project.name}</p>
              <p className="text-text-dim">
                {project.state}
                {project.reportingEnabled ? "" : " · reporting disabled"}
                {exclusion ? ` · ${exclusion.reason}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Sales({ data, query }: { data: WorkspaceData; query: WorkspaceQuery }) {
  const rows = salesRows(data, query);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Sales and transactions</h2>
      {query.metric ? <p className="text-sm text-text-dim">Drill-through for {query.metric.replaceAll("_", " ")}.</p> : null}
      {data.drill && "error" in data.drill ? <p className="text-sm text-error">Drill {data.drill.error.replaceAll("_", " ")}.</p> : null}
      {data.drill && "records" in data.drill ? (
        <ul className="flex flex-col gap-2 text-sm">
          {data.drill.records.length === 0 ? <li className="text-text-dim">No drill records for this metric.</li> : null}
          {data.drill.records.map((record, index) => (
            <li key={String(record.observation_id ?? index)} className="rounded-md border border-border px-3 py-2">
              <p>
                {String(record.record_type ?? "record")} · revision {String(record.revision ?? "")} · {String(record.formula_version ?? "")}
              </p>
              <p>{typeof record.original_amount === "string" ? `${record.original_amount} ${String(record.original_currency ?? "")}` : "Unavailable"}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {"error" in rows ? <p className="text-sm text-text-dim">Sales rows are unavailable.</p> : null}
      {"rows" in rows && rows.rows.length === 0 ? <p className="text-sm text-text-dim">No observations in this window.</p> : null}
      {"rows" in rows ? (
        <ul className="flex flex-col gap-2 text-sm">
          {rows.rows.map((row) => (
            <li key={row.id} className="rounded-md border border-border px-3 py-2">
              <p>
                {row.recordType} · {row.status} · {row.quality} · {row.projectSlug ?? "unknown project"}
              </p>
              <p>{row.amount === null ? "Unavailable" : `${row.amount} ${row.currency ?? ""}`}{row.amountReason ? ` · ${row.amountReason}` : ""}</p>
              <p className="text-xs text-text-dim">
                {row.occurredAt} · {row.source ?? "source unspecified"} · {row.channel ?? "channel unspecified"} · {row.store ?? "store unspecified"} · {row.processor ?? "processor unspecified"}
              </p>
              <p className="text-xs text-text-dim">
                {row.formulaVersion} · revision {row.revision}
                {row.supersedesRevision ? ` · replaces ${row.supersedesRevision}` : ""} · {row.postingRole}
              </p>
              {row.components.length > 0 ? (
                <ul className="mt-1 text-xs text-text-dim">
                  {row.components.map((component) => (
                    <li key={component.componentId}>
                      {component.componentType} · {component.quality} · {component.amount === null ? "Unavailable" : `${component.amount} ${component.currency ?? ""}`} · {component.postingRole}
                      {component.reason ? ` · ${component.reason}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Expenses({ data, query, canWrite }: { data: WorkspaceData; query: WorkspaceQuery; canWrite: boolean }) {
  if ("error" in data.expenses) return <p className="text-sm text-text-dim">Expenses are unavailable.</p>;
  const rows = data.expenses.rows.filter((row) => {
    if (query.project && row.projectSlug && row.projectSlug !== query.project) return false;
    if (query.currency && row.currency !== query.currency) return false;
    if (query.status && row.status !== query.status) return false;
    return true;
  });
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Expenses</h2>
      {query.source ? <p className="text-sm text-text-dim">The source filter applies to sales rows.</p> : null}
      {rows.length === 0 ? <p className="text-sm text-text-dim">No expenses match these filters.</p> : null}
      <ul className="flex flex-col gap-3 text-sm">
        {rows.map((expense) => (
          <li key={expense.id} className="rounded-md border border-border px-3 py-3">
            <p>
              {expense.workflowKind} · {expense.status} · {expense.sourceOwner === "simnetiq" ? "Central" : expense.projectSlug ?? "Source project"}
            </p>
            <p>{expense.amount === null ? "Unavailable" : `${expense.amount} ${expense.currency ?? ""}`}</p>
            <p className="text-xs text-text-dim">
              {expense.vendor ?? "No vendor"} · service {expense.serviceOn ?? "unset"} · tax {expense.taxAmount ?? "unset"}
            </p>
            {expense.allocations.length > 0 ? (
              <ul className="mt-1 text-xs text-text-dim">
                {expense.allocations.map((allocation) => (
                  <li key={allocation.id}>
                    {allocation.projectSlug ?? "project"} · {allocation.amount ?? "Unavailable"}
                  </li>
                ))}
              </ul>
            ) : null}
            {expense.sourceOwner === "project" ? (
              <p className="mt-2 text-text-dim">Edited in the source project. This workspace does not change source-owned expenses.</p>
            ) : canWrite ? (
              <ExpenseActions expense={expense} projects={data.projects} />
            ) : (
              <p className="mt-2 text-text-dim">Read-only membership.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Subscriptions({ data }: { data: WorkspaceData }) {
  if ("error" in data.snapshots) return <p className="text-sm text-text-dim">Subscription snapshots are unavailable.</p>;
  const subscriptions = data.snapshots.rows.filter((row) => row.dataset === "subscriptions/summary");
  const operations = data.snapshots.rows.filter((row) => row.dataset === "operations/daily");
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Doppler subscriptions</h2>
      {subscriptions.length === 0 ? <p className="text-sm text-text-dim">No subscription snapshot is imported. MRR stays unavailable.</p> : null}
      {subscriptions.map((row) => {
        const view = subscriptionView(row.body);
        return (
          <article key={row.snapshotId} className="rounded-md border border-border px-3 py-3 text-sm">
            <p className="text-xs text-text-dim">
              {row.projectSlug ?? "project"} · {row.status} · as of {row.dataAsOf ?? "unknown"}
            </p>
            {view.state === "missing" ? <p>Subscription metrics are unavailable.</p> : null}
            {view.state === "unsupported" ? (
              <p>
                Unsupported · {view.reason}. MRR is not zero.
              </p>
            ) : null}
            {view.state === "ready" ? (
              <dl className="mt-2 grid gap-1">
                <div>Recurring contracts {view.contracts.value ?? "Unavailable"}{view.contracts.reason ? ` · ${view.contracts.reason}` : ""}</div>
                <div>Customers {view.customers.value ?? "Unavailable"}{view.customers.reason ? ` · ${view.customers.reason}` : ""}</div>
                <div>Paid access {view.paidAccess.value ?? "Unavailable"}{view.paidAccess.reason ? ` · ${view.paidAccess.reason}` : ""}</div>
                <div>
                  MRR <MoneyValue metric={view.mrr} />
                </div>
              </dl>
            ) : null}
            {view.state !== "missing" ? view.warnings.map((warning) => <p key={warning} className="text-xs text-text-dim">{warning}</p>) : null}
          </article>
        );
      })}
      <h3 className="text-sm font-medium">Supported operations</h3>
      {operations.length === 0 ? <p className="text-sm text-text-dim">No operations snapshot is imported.</p> : null}
      {operations.map((row) => {
        const operationsView = operationRows(row.body);
        if (!operationsView) return <p key={row.snapshotId}>Operations snapshot is unreadable.</p>;
        return (
          <article key={row.snapshotId} className="text-sm">
            <p className="text-xs text-text-dim">{row.projectSlug} · {row.status}</p>
            <ul>
              {operationsView.flows.map((flow) => (
                <li key={`${flow.date}-${flow.name}`}>
                  {flow.date} · {flow.name} · {flow.count}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-text-dim">Stocks are not added across days.</p>
            <ul>
              {operationsView.stocks.map((stock) => (
                <li key={`${stock.date}-${stock.name}`}>
                  {stock.date} · {stock.name} · {stock.count}
                </li>
              ))}
            </ul>
            {operationsView.warnings.map((warning) => (
              <p key={warning} className="text-xs text-text-dim">{warning}</p>
            ))}
          </article>
        );
      })}
    </section>
  );
}

function Traffic({ data }: { data: WorkspaceData }) {
  if ("error" in data.snapshots) return <p className="text-sm text-text-dim">Analytics snapshots are unavailable.</p>;
  const reports = readTrafficReports(data.snapshots.rows);
  const view = trafficPresentation(reports);
  const funnel = funnelDenominators(reports);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Traffic</h2>
      <p className="text-sm text-text-dim">Distinct users stay with their provider, grain, and timezone. Daily rows are not a period total.</p>
      {reports.length === 0 ? <p className="text-sm text-text-dim">No analytics snapshot has been imported. Visitor totals stay unavailable.</p> : null}
      <p className="text-sm">Combined distinct users: Unavailable</p>
      {view.periodHeadlines.map((report) => (
        <article key={`${report.project}-${report.report}`} className="rounded-md border border-border px-3 py-3 text-sm">
          <h3 className="font-medium">
            {report.provider} · {report.report} · {report.project}
          </h3>
          <p className="text-xs text-text-dim">
            {report.sourceTimezone ?? "timezone unavailable"} · {report.grain ?? "grain stored on the snapshot"} · {report.status} · {report.availability}
            {report.reason ? ` · ${report.reason}` : ""}
          </p>
          {report.availability !== "available" ? <p>Unavailable</p> : null}
          <ul>
            {report.rows.map((row, index) => (
              <li key={index}>{Object.entries(row).map(([key, value]) => `${key} ${value === null ? "unavailable" : String(value)}`).join(" · ")}</li>
            ))}
          </ul>
          {report.limitations.map((limitation) => (
            <p key={limitation} className="text-xs text-text-dim">{limitation}</p>
          ))}
        </article>
      ))}
      {view.dailyRows.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Daily rows</h3>
          <ul className="mt-2 text-sm">
            {view.dailyRows.map((row, index) => (
              <li key={index}>
                {row.provider} · {row.project} · {Object.entries(row.row).map(([key, value]) => `${key} ${value === null ? "unavailable" : String(value)}`).join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {view.dimensionReports.map((report) => (
        <article key={`${report.project}-${report.report}`} className="text-sm">
          <h3 className="font-medium">{report.provider} dimension rows</h3>
          <p className="text-xs text-text-dim">
            These rows are not a property total{report.completePropertyTotal === false ? " and the page is not a complete property total" : ""}. Query rows are not joined to customers.
          </p>
          <ul>
            {report.rows.map((row, index) => (
              <li key={index}>{Object.entries(row).map(([key, value]) => `${key} ${String(value)}`).join(" · ")}</li>
            ))}
          </ul>
        </article>
      ))}
      <section className="text-sm">
        <h3 className="font-medium">Funnel denominators</h3>
        <p>App {funnel.app ?? "Unavailable"}</p>
        <p>Web {funnel.web ?? "Unavailable"}</p>
        <p>Unknown attribution {funnel.unknown ?? "not present in the imported rows"}</p>
      </section>
    </section>
  );
}

function Accounts({ data, query, base }: { data: WorkspaceData; query: WorkspaceQuery; base: "/admin" | "/tg" }) {
  const primary = primaryReport(data);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Accounts and payouts</h2>
      {primary.error ? <p className="text-sm text-error">Report {primary.error.replaceAll("_", " ")}.</p> : null}
      {primary.report ? <ReportBlocks report={primary.report} query={query} base={base} verifiedCash={verifiedFor(data, query.basis)} /> : null}
    </section>
  );
}

function Reports({ data, query, base }: { data: WorkspaceData; query: WorkspaceQuery; base: "/admin" | "/tg" }) {
  const primary = primaryReport(data);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Reports</h2>
      <p className="text-sm text-text-dim">
        {query.grain} · {query.basis} · {query.from} to {query.to} · coverage {primary.report?.coverage ?? "unavailable"}
      </p>
      {primary.error ? <p className="text-sm text-error">Report {primary.error.replaceAll("_", " ")}.</p> : null}
      {primary.report ? <ReportBlocks report={primary.report} query={query} base={base} verifiedCash={verifiedFor(data, query.basis)} /> : <LegacyView legacy={null} />}
      <a className="min-h-11 w-fit rounded-md border border-border px-3 py-2 text-sm" href={csvHref(query)}>
        Download CSV
      </a>
    </section>
  );
}

function Integrations({ data }: { data: WorkspaceData }) {
  return (
    <section className="flex flex-col gap-4 text-sm">
      <h2 className="text-lg font-medium">Integrations</h2>
      {data.connections.length === 0 ? <p className="text-text-dim">No source connection is registered.</p> : null}
      <ul className="flex flex-col gap-2">
        {data.connections.map((connection) => {
          const health = "error" in data.health ? null : data.health.rows.find((row) => row.connectionId === connection.id);
          return (
            <li key={connection.id} className="rounded-md border border-border px-3 py-2">
              <p>{connection.projectSlug ?? "project"} · {connection.environment}</p>
              <p className="break-all text-xs text-text-dim">{connection.baseUrl}</p>
              <p className="text-xs text-text-dim">Secret reference {connection.secretReference}</p>
              <p className="text-xs text-text-dim">Health {health?.status ?? ("error" in data.health ? "unavailable" : "unconfigured")}</p>
            </li>
          );
        })}
      </ul>
      {"error" in data.runs ? <p className="text-text-dim">Sync runs are unavailable.</p> : null}
      {"rows" in data.runs && data.runs.rows.length === 0 ? <p className="text-text-dim">No sync runs yet.</p> : null}
      {"rows" in data.runs ? (
        <ul>
          {data.runs.rows.map((run, index) => (
            <li key={`${run.endpoint}-${index}`}>
              {run.endpoint} · {run.status}
              {run.errorCode ? ` · ${run.errorCode}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {"error" in data.quarantine ? <p className="text-text-dim">Quarantine is unavailable.</p> : null}
      {"rows" in data.quarantine ? (
        <ul>
          {data.quarantine.rows.map((row, index) => (
            <li key={`${row.endpoint}-${index}`}>
              {row.endpoint} · {row.reason}
            </li>
          ))}
        </ul>
      ) : null}
      {"error" in data.gates ? <p className="text-text-dim">Dataset gates are unavailable.</p> : null}
      {"rows" in data.gates ? (
        <ul>
          {data.gates.rows.map((gate) => (
            <li key={`${gate.projectSlug}-${gate.dataset}-${gate.basis}`}>
              {gate.projectSlug} · {gate.dataset} · {gate.basis} · {gate.state}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function MoreLinks({ base, query }: { base: "/admin" | "/tg"; query: WorkspaceQuery }) {
  const links = [
    ["projects", "Projects"],
    ["traffic", "Traffic"],
    ["timeline", "Timeline"],
    ["records", "Business records"],
    ["integrations", "Integrations"],
    ["settings", "Settings"],
  ] as const;
  return (
    <nav className="flex flex-col gap-2" aria-label="More">
      {links.map(([section, label]) => (
        <a key={section} className="min-h-11 rounded-md border border-border px-3 py-2 text-sm" href={workspaceHref(base, query, { section, metric: null })}>
          {label}
        </a>
      ))}
    </nav>
  );
}
