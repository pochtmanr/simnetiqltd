import { NewEntryButton } from "@/components/business-os/admin/chrome";
import { DrillTable, ExpensesTable, SalesTable } from "@/components/business-os/admin/tables";
import { Card, CardHead, Notice, Section } from "@/components/business-os/ui/primitives";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { METRIC_LABELS, humanize } from "@/lib/business-os/workspace/format";
import { OBSERVATION_LIMIT, type WorkspaceData } from "@/lib/business-os/workspace/load";
import { filterLabeledRows } from "@/lib/business-os/workspace/present";

export function Sales({ query, data }: { query: WorkspaceQuery; data: WorkspaceData }) {
  const rows =
    "error" in data.observations
      ? null
      : filterLabeledRows(
          data.observations.rows.filter((row) => !query.project || row.projectSlug === query.project),
          query,
        );
  const capped = !("error" in data.observations) && data.observations.rows.length >= OBSERVATION_LIMIT;
  return (
    <div className="flex flex-col gap-8">
      {query.metric ? (
        <Section
          title={`Behind ${METRIC_LABELS[query.metric] ?? humanize(query.metric)}`}
          description="Ledger records that make up this figure."
          actions={
            <a className="bos-caption bos-link" href={workspaceHref("/admin", query, { metric: null })}>
              Back to all sales
            </a>
          }
        >
          {data.drill && "error" in data.drill ? <Notice tone="bad">Drill {humanize(data.drill.error).toLowerCase()}.</Notice> : null}
          {data.drill && "records" in data.drill ? (
            <Card className="overflow-hidden">
              <DrillTable records={data.drill.records} />
            </Card>
          ) : null}
        </Section>
      ) : null}
      <Section title={query.metric ? "All sales and transactions" : undefined}>
        {rows === null ? (
          <Notice>Sales rows are unavailable.</Notice>
        ) : (
          <Card className="overflow-hidden">
            <CardHead title={`${rows.length} record${rows.length === 1 ? "" : "s"}`} meta={capped ? `Showing the latest ${OBSERVATION_LIMIT}. Narrow the period to see older rows.` : undefined} />
            <SalesTable rows={rows} projects={data.projects} />
          </Card>
        )}
      </Section>
    </div>
  );
}

export function Expenses({ query, data, canWrite }: { query: WorkspaceQuery; data: WorkspaceData; canWrite: boolean }) {
  if ("error" in data.expenses) return <Notice>Expenses are unavailable.</Notice>;
  const rows = data.expenses.rows.filter((row) => {
    if (query.project && row.projectSlug && row.projectSlug !== query.project) return false;
    if (query.currency && row.currency !== query.currency) return false;
    if (query.status && row.status !== query.status) return false;
    return true;
  });
  const drafts = rows.filter((row) => row.status === "draft").length;
  const sourceOwned = rows.filter((row) => row.sourceOwner === "project").length;
  const categories = "error" in data.categories ? null : data.categories.rows;
  return (
    <div className="flex flex-col gap-4">
      {query.source ? <Notice>The source filter applies to sales rows.</Notice> : null}
      {sourceOwned > 0 ? (
        <Notice>
          {sourceOwned === 1 ? "One expense is edited in the source project and stays" : `${sourceOwned} expenses are edited in the source project and stay`} read-only here.
        </Notice>
      ) : null}
      <Card className="overflow-hidden">
        <CardHead
          title={`${rows.length} expense${rows.length === 1 ? "" : "s"}`}
          meta={drafts > 0 ? `${drafts} draft${drafts === 1 ? "" : "s"} waiting to be posted` : "All dates"}
          actions={canWrite ? <NewEntryButton projects={data.projects} categories={categories} project={query.project} kind="expense" label="Add expense" /> : null}
        />
        <ExpensesTable rows={rows} projects={data.projects} canWrite={canWrite} />
      </Card>
    </div>
  );
}
