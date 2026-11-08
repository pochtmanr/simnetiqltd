import { Amount, KpiCard, QualityPill, deltaOf, series, trendPoints } from "@/components/business-os/admin/parts";
import { SeriesChart } from "@/components/business-os/ui/charts";
import { CashIcon, ProfitIcon, ProceedsIcon, SalesIcon } from "@/components/business-os/admin/sections/glyphs";
import { Card, CardHead, EmptyState, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { SourcesIcon } from "@/components/business-os/ui/icons";
import { attentionFor, headlineMetrics, primaryReport, verifiedFor } from "@/lib/business-os/workspace/derive";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { formatMoney, humanize, relativeTime } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import { cashCaption } from "@/lib/business-os/workspace/present";

const BASE = "/admin" as const;

export function Overview({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const primary = primaryReport(data);
  const trend = trendPoints(data, query.currency);
  const link = (section: string) => workspaceHref(BASE, query, { section, metric: null });

  return (
    <div className="flex flex-col gap-8">
      {primary.error ? <Notice tone="bad">Report {humanize(primary.error).toLowerCase()}.</Notice> : null}
      {"error" in data.gates ? <Notice>Dataset gates are unavailable.</Notice> : null}
      <AttentionCard query={query} data={data} />
      <HeadlineKpis query={query} data={data} />

      <div className="bos-grid-2">
        <Card>
          <CardHead title="Trend" meta={trend.currency ? `Monthly · ${trend.currency}` : "Monthly"} />
          <div className="p-3 md:p-5">
            <SeriesChart
              kind="area"
              currency={trend.currency}
              data={trend.points.map((point) => ({
                label: point.label,
                sales: point.metrics?.gross_customer_sales?.amount != null ? Number(point.metrics.gross_customer_sales.amount) : null,
                proceeds: point.metrics?.net_proceeds?.amount != null ? Number(point.metrics.net_proceeds.amount) : null,
                profit: point.metrics?.operating_profit?.amount != null ? Number(point.metrics.operating_profit.amount) : null,
              }))}
              series={[
                { key: "sales", label: "Sales" },
                { key: "proceeds", label: "Net proceeds" },
                { key: "profit", label: "Operating profit", color: 2 },
              ]}
              empty={trend.reason ?? "No monthly history for this period yet."}
            />
          </div>
        </Card>
        <SourceFreshness data={data} href={link("integrations")} />
      </div>

      <ProjectTable query={query} data={data} />
    </div>
  );
}

export function AttentionCard({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const attention = attentionFor(data);
  if (attention.length === 0) return null;
  const link = (section: string) => workspaceHref(BASE, query, { section, metric: null });
  return (
    <Card>
      <CardHead title={`Needs attention · ${attention.length}`} actions={<a className="bos-caption bos-link" href={link("integrations")}>Open sources</a>} />
      <ul className="flex flex-col gap-2 p-4 md:px-5">
        {attention.slice(0, 4).map((item) => (
          <li key={item}>
            <Notice tone={/outage|degraded|stale|unmatched/i.test(item) ? "warn" : "info"}>{item}</Notice>
          </li>
        ))}
        {attention.length > 4 ? <li className="bos-caption">and {attention.length - 4} more on the Sources page.</li> : null}
      </ul>
    </Card>
  );
}

/** The four headline figures for the window. Sparklines and deltas appear only when trend data was loaded. */
export function HeadlineKpis({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const primary = primaryReport(data);
  const bucket = primary.report?.buckets[0] ?? null;
  const headline = headlineMetrics(bucket);
  const trend = trendPoints(data, query.currency);
  const verified = verifiedFor(data, query.basis);
  const balances = bucket?.cash.balances ?? [];
  const balance = balances.find((item) => item.snapshotKind === "cash") ?? balances[0] ?? null;
  const link = (section: string, metric: WorkspaceQuery["metric"] = null) => workspaceHref(BASE, query, { section, metric });
  // Month-on-month change only makes sense when the period is a month.
  const delta = (metric: string) => (query.grain === "month" ? deltaOf(trend.points, metric) : null);

  return (
    <Section>
      {!bucket ? (
        <Card>
          <EmptyState icon={<SalesIcon />} title="No report for this period">
            Nothing has been imported for this window yet. Try another period or check Sources.
          </EmptyState>
        </Card>
      ) : (
        <div className="bos-kpis">
          <KpiCard
            label="Sales"
            icon={<SalesIcon />}
            metric={headline.metrics?.gross_customer_sales ?? null}
            href={link("sales", "gross_customer_sales")}
            spark={series(trend.points, "gross_customer_sales")}
            delta={delta("gross_customer_sales")}
            caption={headline.limit ?? undefined}
          />
          <KpiCard
            label="Net proceeds"
            icon={<ProceedsIcon />}
            metric={headline.metrics?.net_proceeds ?? null}
            href={link("sales", "net_proceeds")}
            spark={series(trend.points, "net_proceeds")}
            delta={delta("net_proceeds")}
            caption={headline.limit ?? undefined}
          />
          <KpiCard
            label="Operating profit"
            icon={<ProfitIcon />}
            metric={headline.metrics?.operating_profit ?? null}
            href={link("reports")}
            spark={series(trend.points, "operating_profit")}
            delta={delta("operating_profit")}
            caption={headline.limit ?? undefined}
          />
          <KpiCard
            label="Cash"
            icon={<CashIcon />}
            value={balance && balance.amount !== null ? formatMoney(balance.amount, balance.currency) : null}
            href={link("accounts")}
            caption={
              balance
                ? `${cashCaption(balance.snapshotKind, verified)}${balances.length > 1 ? ` · 1 of ${balances.length} balances` : " · not additive"}`
                : "No balance snapshot in this window."
            }
          />
        </div>
      )}
    </Section>
  );
}

export function SourceFreshness({ data, href }: { data: WorkspaceData; href: string }) {
  const healthRows = "error" in data.health ? null : data.health.rows;
  return (
    <Card>
      <CardHead title="Sources" meta="Last successful sync" actions={<a className="bos-caption bos-link" href={href}>Manage</a>} />
      {healthRows === null ? (
        <div className="p-4">
          <Notice>Source health is unavailable.</Notice>
        </div>
      ) : null}
      {data.connections.length === 0 ? (
        <EmptyState icon={<SourcesIcon />} title="No sources yet">
          No source connection is registered.
        </EmptyState>
      ) : (
        <ul className="bos-rows">
          {data.connections.map((connection) => {
            const health = healthRows?.find((row) => row.connectionId === connection.id);
            const status = health?.status ?? (healthRows ? "unconfigured" : "unavailable");
            const name = data.projects.find((project) => project.slug === connection.projectSlug)?.name ?? connection.projectSlug ?? "Unassigned";
            return (
              <li key={connection.id} className="bos-row">
                <span className="bos-row__main">
                  <span className="bos-row__title">{name}</span>
                  <span className="bos-caption" title={health?.lastSuccessAt ?? undefined}>
                    {connection.environment} · {health?.lastSuccessAt ? `synced ${relativeTime(health.lastSuccessAt)}` : "no successful sync"}
                  </span>
                </span>
                <StatusPill status={status} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ProjectTable({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  if (data.byProject.length === 0) return null;
  const metrics = ["gross_customer_sales", "net_proceeds", "operating_profit"] as const;
  return (
    <Section title="Projects" description="Native currency, this period. Click a project to scope the workspace to it.">
      <Card className="overflow-hidden">
        <div className="bos-table-wrap">
          <table className="bos-table" aria-label="Project performance">
            <thead>
              <tr>
                <th>Project</th>
                <th>Currency</th>
                <th data-align="end">Sales</th>
                <th data-align="end">Net proceeds</th>
                <th data-align="end" className="hidden sm:table-cell">
                  Operating profit
                </th>
              </tr>
            </thead>
            <tbody>
              {data.byProject.flatMap((project) => {
                const name = data.projects.find((item) => item.slug === project.slug)?.name ?? project.slug;
                const projectHref = workspaceHref(BASE, query, { project: project.slug, section: "overview", metric: null });
                const blocks = project.report?.buckets[0]?.native ?? [];
                if (project.error || blocks.length === 0) {
                  return [
                    <tr key={project.slug}>
                      <td>
                        <a className="font-medium" href={projectHref}>
                          {name}
                        </a>
                      </td>
                      <td colSpan={4} className="bos-caption">
                        {project.error ? `Report ${humanize(project.error).toLowerCase()}.` : "No report bucket for this window."}
                      </td>
                    </tr>,
                  ];
                }
                return blocks.map((block, index) => (
                  <tr key={`${project.slug}-${block.currency}`}>
                    <td>
                      {index === 0 ? (
                        <a className="font-medium" href={projectHref}>
                          {name}
                        </a>
                      ) : null}
                    </td>
                    <td className="bos-caption">{block.currency}</td>
                    {metrics.map((metric) => (
                      <td key={metric} data-align="end" className={metric === "operating_profit" ? "hidden sm:table-cell" : undefined}>
                        <span className="inline-flex items-center gap-2">
                          <QualityPill metric={block.metrics[metric] ?? null} compact />
                          <Amount amount={block.metrics[metric]?.amount ?? null} currency={block.currency} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}
