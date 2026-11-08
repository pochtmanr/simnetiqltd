import { KpiCard } from "@/components/business-os/admin/parts";
import { GenericTable } from "@/components/business-os/admin/tables";
import { SeriesChart, type ChartRow } from "@/components/business-os/ui/charts";
import { AudienceIcon, RepeatIcon } from "@/components/business-os/ui/icons";
import { Markdown } from "@/components/business-os/ui/markdown";
import { Card, CardHead, EmptyState, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import { formatDateTime, formatShortDate, groupDigits, humanize } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import { funnelDenominators, operationRows, readTrafficReports, subscriptionView, trafficPresentation, type TrafficReport } from "@/lib/business-os/workspace/present";
import { NOT_A_COUNT, dateKey, genericRows, numericKeys } from "@/lib/business-os/workspace/sources";

const count = (value: string | null) => (value === null ? null : groupDigits(value));

/* ---------- Subscriptions ---------- */

export function Subscriptions({ data }: { data: WorkspaceData }) {
  if ("error" in data.snapshots) return <Notice>Subscription snapshots are unavailable.</Notice>;
  const subscriptions = data.snapshots.rows.filter((row) => row.dataset === "subscriptions/summary");
  const operations = data.snapshots.rows.filter((row) => row.dataset === "operations/daily");
  return (
    <div className="flex flex-col gap-8">
      {subscriptions.length === 0 ? (
        <Card>
          <EmptyState icon={<RepeatIcon />} title="No subscription data yet">
            No subscription snapshot is imported. MRR stays unavailable.
          </EmptyState>
        </Card>
      ) : null}
      {subscriptions.map((row) => {
        const view = subscriptionView(row.body);
        return (
          <Section
            key={row.snapshotId}
            title={humanize(row.projectSlug ?? "Project")}
            description={`As of ${formatDateTime(row.dataAsOf, "unknown")}`}
            actions={<StatusPill status={row.status} />}
          >
            {view.state === "missing" ? <Notice>Subscription metrics are unavailable.</Notice> : null}
            {view.state === "unsupported" ? <Notice>Not reported by this source · {humanize(view.reason).toLowerCase()}. MRR is not zero.</Notice> : null}
            {view.state === "ready" ? (
              <div className="bos-kpis">
                <KpiCard label="MRR" metric={view.mrr} />
                <KpiCard label="Recurring contracts" value={count(view.contracts.value)} caption={view.contracts.reason ? humanize(view.contracts.reason) : undefined} />
                <KpiCard label="Customers" value={count(view.customers.value)} caption={view.customers.reason ? humanize(view.customers.reason) : undefined} />
                <KpiCard label="Paid access" value={count(view.paidAccess.value)} caption={view.paidAccess.reason ? humanize(view.paidAccess.reason) : undefined} />
              </div>
            ) : null}
            {view.state !== "missing" ? view.warnings.map((warning) => <p key={warning} className="bos-caption">{warning}</p>) : null}
          </Section>
        );
      })}

      <Section title="Operations" description="Daily flows add up; stocks are a level per day and are not added across days.">
        {operations.length === 0 ? (
          <Card>
            <EmptyState title="No operations snapshot is imported." />
          </Card>
        ) : null}
        {operations.map((row) => {
          const view = operationRows(row.body);
          if (!view) return <Notice key={row.snapshotId}>Operations snapshot is unreadable.</Notice>;
          const flowNames = [...new Set(view.flows.map((flow) => flow.name))];
          const dates = [...new Set(view.flows.map((flow) => flow.date))].sort();
          const chart: ChartRow[] = dates.map((date) => {
            const point: ChartRow = { label: formatShortDate(date) };
            for (const name of flowNames) {
              const hit = view.flows.find((flow) => flow.date === date && flow.name === name);
              point[name] = hit ? Number(hit.count) : null;
            }
            return point;
          });
          const stocks = view.stocks.map((stock) => ({ date: stock.date, name: humanize(stock.name), count: groupDigits(stock.count) }));
          return (
            <div key={row.snapshotId} className="bos-grid-2">
              <Card>
                <CardHead title={`Daily flows · ${humanize(row.projectSlug ?? "project")}`} actions={<StatusPill status={row.status} />} />
                <div className="p-3 md:p-5">
                  <SeriesChart kind="bar" unit="count" stacked data={chart} series={flowNames.map((name) => ({ key: name, label: humanize(name) }))} empty="No flows in this snapshot." />
                </div>
              </Card>
              <Card className="overflow-hidden">
                <CardHead title="Stocks" meta="Not added across days" />
                <GenericTable label="Stocks" columns={["date", "name", "count"]} rows={stocks} />
              </Card>
              {view.warnings.map((warning) => (
                <p key={warning} className="bos-caption">
                  {warning}
                </p>
              ))}
            </div>
          );
        })}
      </Section>
    </div>
  );
}

/* ---------- Audience ---------- */

function headlineValue(report: TrafficReport): string | null {
  const row = report.rows[0];
  if (!row) return null;
  const numeric = Object.entries(row).find(([key, value]) => !NOT_A_COUNT.test(key) && (typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))));
  return numeric ? groupDigits(String(numeric[1])) : null;
}

export function Audience({ data }: { data: WorkspaceData }) {
  if ("error" in data.snapshots) return <Notice>Analytics snapshots are unavailable.</Notice>;
  const reports = readTrafficReports(data.snapshots.rows);
  const view = trafficPresentation(reports);
  const funnel = funnelDenominators(reports);
  const providers = [...new Set(view.dailyRows.map((row) => `${row.provider}|${row.project}`))];

  return (
    <div className="flex flex-col gap-8">
      <Notice>
        Distinct users stay with their provider, grain, and timezone. Daily rows are not a period total, and combined distinct users stay unavailable.
      </Notice>
      {reports.length === 0 ? (
        <Card>
          <EmptyState icon={<AudienceIcon />} title="No analytics yet">
            No analytics snapshot has been imported. Visitor totals stay unavailable.
          </EmptyState>
        </Card>
      ) : null}

      {view.periodHeadlines.length > 0 ? (
        <div className="bos-kpis">
          {view.periodHeadlines.map((report) => (
            <KpiCard
              key={`${report.project}-${report.report}`}
              label={`${humanize(report.provider)} · ${humanize(report.report)}`}
              value={report.availability === "available" ? headlineValue(report) : null}
              caption={`${humanize(report.project)} · ${report.sourceTimezone ?? "timezone unavailable"}${report.reason ? ` · ${humanize(report.reason)}` : ""}`}
            />
          ))}
        </div>
      ) : null}

      {providers.map((key) => {
        const [provider, project] = key.split("|");
        const rows = view.dailyRows.filter((row) => row.provider === provider && row.project === project).map((row) => row.row);
        const dateField = dateKey(rows);
        const metrics = numericKeys(rows).slice(0, 4);
        const chart: ChartRow[] = rows.map((row, index) => {
          const point: ChartRow = { label: dateField ? formatShortDate(String(row[dateField])) : String(index + 1) };
          for (const metric of metrics) point[metric] = row[metric] === null || row[metric] === undefined ? null : Number(row[metric]);
          return point;
        });
        return (
          <Card key={key}>
            <CardHead title={`${humanize(provider)} · ${humanize(project)}`} meta="Daily, in the provider's timezone" />
            <div className="p-3 md:p-5">
              <SeriesChart kind="line" unit="count" data={chart} series={metrics.map((metric) => ({ key: metric, label: humanize(metric) }))} />
            </div>
          </Card>
        );
      })}

      {view.dimensionReports.map((report) => {
        const table = genericRows({ rows: report.rows });
        return (
          <Section
            key={`${report.project}-${report.report}`}
            title={`${humanize(report.provider)} · ${humanize(report.report)}`}
            description={`These rows are not a property total${report.completePropertyTotal === false ? " and the page is not a complete property total" : ""}. Query rows are not joined to customers.`}
          >
            <Card className="overflow-hidden">
              <GenericTable label={humanize(report.report)} columns={table.columns} rows={table.rows} />
            </Card>
            {report.limitations.length > 0 ? <Markdown size="sm">{report.limitations.map((item) => `- ${item}`).join("\n")}</Markdown> : null}
          </Section>
        );
      })}

      <Section title="Funnel denominators" description="Where the first step of the funnel is attributed.">
        <div className="bos-kpis">
          <KpiCard label="App" value={count(funnel.app)} />
          <KpiCard label="Web" value={count(funnel.web)} />
          <KpiCard label="Unknown attribution" value={funnel.unknown} caption={funnel.unknown === null ? "Not present in the imported rows" : undefined} />
        </div>
      </Section>
    </div>
  );
}
