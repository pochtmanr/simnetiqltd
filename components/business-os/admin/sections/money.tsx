import { Amount, QualityPill } from "@/components/business-os/admin/parts";
import { CashIcon, DownloadIcon, StatementIcon } from "@/components/business-os/ui/icons";
import { ButtonLink, Card, CardHead, EmptyState, KeyValues, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { primaryReport, verifiedFor } from "@/lib/business-os/workspace/derive";
import { csvHref, workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { BASIS_LABELS, METRIC_LABELS, formatDate, formatDateTime, humanize, periodLabel } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import { OVERVIEW_METRICS, cashCaption, type ReportBucket } from "@/lib/business-os/workspace/present";

const BASE = "/admin" as const;

function bucketLabel(bucket: ReportBucket): string {
  return `${formatDate(bucket.from)} – ${formatDate(bucket.to ? new Date(new Date(bucket.to).getTime() - 1).toISOString() : null)}${bucket.partial ? " · partial" : ""}`;
}

/* ---------- Statements ---------- */

export function Statements({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const primary = primaryReport(data);
  const report = primary.report;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="bos-caption">
          {periodLabel(query)} · counted when {BASIS_LABELS[query.basis]?.label.toLowerCase() ?? query.basis} · coverage {report?.coverage ?? "unavailable"} · UK time
        </p>
        <ButtonLink href={csvHref(query)} size="sm">
          <DownloadIcon size={16} />
          Download CSV
        </ButtonLink>
      </div>
      {primary.error ? <Notice tone="bad">Report {humanize(primary.error).toLowerCase()}.</Notice> : null}
      {report?.exclusions.length ? (
        <Notice tone="warn">
          Not included: {report.exclusions.map((item) => `${item.projectSlug} (${humanize(item.reason).toLowerCase()})`).join(", ")}.
        </Notice>
      ) : null}
      {!report || report.buckets.length === 0 ? (
        <Card>
          <EmptyState icon={<StatementIcon />} title="No report bucket for this window." />
        </Card>
      ) : (
        report.buckets.map((bucket) => <BucketStatement key={`${bucket.from}-${bucket.to}`} bucket={bucket} query={query} />)
      )}
      {report?.buckets[0] ? <Allocation bucket={report.buckets[0]} /> : null}
      <Legacy legacy={report?.buckets[0]?.legacy ?? null} />
    </div>
  );
}

function BucketStatement({ bucket, query }: { bucket: ReportBucket; query: WorkspaceQuery }) {
  const columns = [
    ...bucket.native.map((block) => ({ key: block.currency, label: block.currency, metrics: block.metrics, currency: block.currency })),
    ...(bucket.gbp.metrics ? [{ key: "gbp", label: "GBP (converted)", metrics: bucket.gbp.metrics, currency: "GBP" }] : []),
  ];
  return (
    <Section title="Profit and loss" description={bucketLabel(bucket)}>
      <Card className="overflow-hidden">
        <div className="bos-table-wrap">
          <table className="bos-table" aria-label="Profit and loss">
            <thead>
              <tr>
                <th>Line</th>
                {columns.map((column) => (
                  <th key={column.key} data-align="end">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OVERVIEW_METRICS.map((metric) => (
                <tr key={metric}>
                  <td className="font-medium">{METRIC_LABELS[metric]}</td>
                  {columns.map((column) => {
                    const value = column.metrics[metric] ?? null;
                    return (
                      <td key={column.key} data-align="end">
                        <a
                          href={workspaceHref(BASE, query, { section: "sales", metric })}
                          className="inline-flex items-center justify-end gap-2 hover:underline"
                          title={value?.reason ? humanize(value.reason) : undefined}
                        >
                          <QualityPill metric={value} compact />
                          <Amount amount={value?.amount ?? null} currency={column.currency} />
                        </a>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {!bucket.gbp.metrics ? (
        <p className="bos-caption">GBP total unavailable{bucket.gbp.reason ? ` · ${humanize(bucket.gbp.reason).toLowerCase()}` : ""}.</p>
      ) : bucket.gbp.policyVersion ? (
        <p className="bos-caption">Converted with policy {bucket.gbp.policyVersion}.</p>
      ) : null}
    </Section>
  );
}

function Allocation({ bucket }: { bucket: ReportBucket }) {
  const allocation = bucket.allocation;
  const rows: [string, string | null][] = [
    ["Before shared allocation", allocation.profit_before],
    ["Shared allocation", allocation.allocation],
    ["After shared allocation", allocation.profit_after],
    ["Company cost", allocation.company_cost],
    ["Unallocated remainder", allocation.unallocated],
  ];
  return (
    <Section title="Shared allocation" description={allocation.reason ? humanize(allocation.reason) : "Shared costs spread across projects, in GBP."}>
      <Card pad>
        <KeyValues rows={rows.map(([label, amount]) => [label, <Amount key={label} amount={amount} currency="GBP" />])} />
      </Card>
    </Section>
  );
}

function Legacy({ legacy }: { legacy: ReportBucket["legacy"] }) {
  if (!legacy) {
    return <p className="bos-caption">Frozen SMS legacy snapshot is absent for this window.</p>;
  }
  const fields = legacy.preserved;
  const currency = legacy.currency ?? "USD";
  return (
    <Section title="Frozen SMS legacy" description={`${legacy.formulaVersion ?? "sms-legacy-usd-v1"} · cash net is proceeds, not bank cash`}>
      <Card pad>
        <KeyValues
          rows={[
            ["Gross", <Amount key="g" amount={fields?.gross ?? null} currency={currency} />],
            ["Apple fee", <Amount key="a" amount={fields?.apple_fee ?? null} currency={currency} />],
            ["Refunds", <Amount key="r" amount={fields?.refunds ?? null} currency={currency} />],
            ["Cash net", <Amount key="c" amount={fields?.cash_net ?? null} currency={currency} />],
            ["Legacy net", <Amount key="l" amount={legacy.legacyNetAmount} currency={currency} />],
            ["Real spend", <span key="s" className="text-[var(--color-text-dim)]">Unavailable{legacy.realSpendReason ? ` · ${humanize(legacy.realSpendReason).toLowerCase()}` : ""}</span>],
          ]}
        />
        {legacy.warnings.map((warning) => (
          <p key={warning} className="bos-caption mt-2">
            {warning}
          </p>
        ))}
      </Card>
    </Section>
  );
}

/* ---------- Cash & payouts ---------- */

export function CashAndPayouts({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const primary = primaryReport(data);
  const verified = verifiedFor(data, query.basis);
  const buckets = primary.report?.buckets ?? [];
  const balances = buckets.flatMap((bucket) => bucket.cash.balances);
  const movements = buckets.flatMap((bucket) => bucket.cash.movements);
  const residuals = buckets.flatMap((bucket) => bucket.cash.residuals);
  return (
    <div className="flex flex-col gap-8">
      {primary.error ? <Notice tone="bad">Report {humanize(primary.error).toLowerCase()}.</Notice> : null}
      <Section title="Balances" description="Point-in-time snapshots. Balances are not additive across days or accounts.">
        {balances.length === 0 ? (
          <Card>
            <EmptyState icon={<CashIcon />} title="No balance snapshot in this window." />
          </Card>
        ) : (
          <div className="bos-kpis">
            {balances.map((balance) => (
              <div key={`${balance.snapshotKind}-${balance.asOf}`} className="bos-card bos-kpi">
                <div className="bos-kpi__top">
                  <span className="bos-label">{humanize(balance.snapshotKind)}</span>
                  <StatusPill status={balance.snapshotKind === "cash" && verified ? "verified" : "unverified"} />
                </div>
                <p className="bos-kpi__value">
                  <Amount amount={balance.amount} currency={balance.currency} />
                </p>
                <p className="bos-caption">
                  {cashCaption(balance.snapshotKind, verified)} · as of {formatDateTime(balance.asOf, "unknown")} · not additive
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Movements" description="Top-ups, payouts and transfers. These are not revenue.">
        <Card className="overflow-hidden">
          {movements.length === 0 ? (
            <EmptyState title="No movements in this window." />
          ) : (
            <table className="bos-table" aria-label="Cash movements">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th data-align="end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement, index) => (
                  <tr key={`${movement.kind}-${index}`}>
                    <td>
                      {humanize(movement.kind)} <span className="bos-caption">· not revenue</span>
                    </td>
                    <td data-align="end">
                      <Amount amount={movement.amount} currency={movement.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Section>
      <Section title="Unmatched settlements" description="Payouts that could not be matched to sales yet.">
        <Card className="overflow-hidden">
          {residuals.length === 0 ? (
            <EmptyState title="Everything is matched." />
          ) : (
            <>
              <CardHead title={`${residuals.length} unmatched settlement${residuals.length === 1 ? "" : "s"} in this window.`} />
              <ul className="bos-rows">
                {residuals.map((residual, index) => (
                  <li key={index} className="bos-row">
                    <span className="bos-row__main">Settlement {index + 1}</span>
                    <Amount amount={residual.amount} currency={residual.currency} className="font-semibold" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </Section>
    </div>
  );
}
