import { DatasetButton } from "@/components/business-os/admin/sections/dataset-button";
import { SourceConnect } from "@/components/business-os/admin/sections/source-connect";
import { hasProjectLogo, ProjectLogo } from "@/components/project-logo";
import { DatabaseIcon, SourcesIcon } from "@/components/business-os/ui/icons";
import { Markdown } from "@/components/business-os/ui/markdown";
import { SheetButton } from "@/components/business-os/ui/overlay";
import { Card, CardHead, EmptyState, KeyValues, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { formatDateTime, humanize, relativeTime } from "@/lib/business-os/workspace/format";
import type { SnapshotRow, WorkspaceData } from "@/lib/business-os/workspace/load";
import { sourceStateFor } from "@/lib/business-os/workspace/derive";
import { describeDataset, genericRows } from "@/lib/business-os/workspace/sources";

/** Where each product's export API lives. A project without an entry can be connected by typing its address. */
const EXPORT_HOSTS: Record<string, string> = {
  doppler: "https://www.dopplervpn.org",
  smscode: "https://simnetiq.xyz",
};

const NOT_CONNECTED: Record<string, string> = {
  not_connected: "Business OS has not pulled anything from this product yet. Connect its export API to bring in sales, costs and visitors.",
  off: "The connection is registered but not switched on.",
};

/**
 * Sources: one card per project, connected or not, with its health, datasets
 * and gates, then sync runs and quarantine. Datasets come from what was
 * imported, so a new integration appears here without UI changes.
 */
export function Sources({ query, data, profile }: { query: WorkspaceQuery; data: WorkspaceData; profile: IdentityProfile }) {
  const healthRows = "error" in data.health ? null : data.health.rows;
  const snapshots = "error" in data.snapshots ? [] : data.snapshots.rows;
  const gates = "error" in data.gates ? [] : data.gates.rows;
  const orphanSnapshots = snapshots.filter((row) => !row.connectionId || !data.connections.some((connection) => connection.id === row.connectionId));
  const owner = profile.role === "owner";

  return (
    <div className="flex flex-col gap-8">
      {healthRows === null ? <Notice>Source health is unavailable.</Notice> : null}

      <Section title="Connections" description="Each product has its own export API. Business OS pulls signed data from it on a timer.">
        {data.projects.length === 0 ? (
          <Card>
            <EmptyState icon={<SourcesIcon />} title="No projects yet">
              No project is registered, so there is nothing to connect.
            </EmptyState>
          </Card>
        ) : (
          <div className="bos-grid-3">
            {data.projects.map((project) => {
              const connection = data.connections.find((row) => row.projectSlug === project.slug);
              const state = sourceStateFor(data, project.slug);
              const health = connection ? healthRows?.find((row) => row.connectionId === connection.id) : undefined;
              const datasets = connection ? snapshots.filter((row) => row.connectionId === connection.id) : [];
              const projectGates = gates.filter((gate) => gate.projectSlug === project.slug);
              const verified = projectGates.filter((gate) => gate.state === "verified").length;
              const connect = owner ? (
                <SheetButton
                  title={connection ? `Refresh ${project.name}` : `Connect ${project.name}`}
                  size="sm"
                  variant={connection?.enabled ? "ghost" : "primary"}
                  label={connection?.enabled ? "Refresh datasets" : connection ? "Switch on" : "Connect"}
                >
                  <SourceConnect
                    projectSlug={project.slug}
                    baseUrl={connection?.baseUrl ?? EXPORT_HOSTS[project.slug] ?? ""}
                    secretReference={connection?.secretReference ?? `BUSINESS_OS_SOURCE_${project.slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_PRODUCTION`}
                    connectionId={connection?.id ?? null}
                  />
                </SheetButton>
              ) : null;
              return (
                <Card key={project.id} as="article">
                  <CardHead
                    title={
                      <span className="flex items-center gap-2">
                        {hasProjectLogo(project.slug) ? <ProjectLogo project={project.slug} alt="" size={20} /> : null}
                        {project.name}
                      </span>
                    }
                    meta={connection ? humanize(connection.environment) : undefined}
                    actions={<StatusPill tone={state.tone} label={state.label} />}
                  />
                  <div className="flex flex-col gap-4 p-4 md:p-5">
                    {connection?.enabled ? (
                      <>
                        <KeyValues
                          rows={[
                            ["Last sync", <span key="s" title={health?.lastSuccessAt ?? undefined}>{health?.lastSuccessAt ? relativeTime(health.lastSuccessAt) : "Not yet"}</span>],
                            ["Last error", health?.lastErrorCode ? humanize(health.lastErrorCode) : "None"],
                            ["Endpoint", <span key="u" className="bos-mono break-all">{connection.baseUrl}</span>],
                            ["Secret reference", <span key="r" className="bos-mono break-all">{connection.secretReference}</span>],
                          ]}
                        />
                        <div className="flex flex-col gap-2">
                          <p className="bos-label">Datasets</p>
                          {datasets.length === 0 ? <p className="bos-caption">Nothing imported yet. The first pass takes a while: one page per timer tick.</p> : <DatasetList rows={datasets} query={query} />}
                        </div>
                      </>
                    ) : (
                      <p className="bos-body">{NOT_CONNECTED[state.status] ?? NOT_CONNECTED.not_connected}</p>
                    )}
                    {projectGates.length > 0 ? (
                      <details className="flex flex-col gap-2">
                        <summary className="bos-caption cursor-pointer">
                          Verification gates · {verified} of {projectGates.length} verified
                        </summary>
                        <p className="bos-caption mt-2">A gate turns green once imported figures are checked against the product&apos;s own admin. That check is not built yet.</p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {projectGates.map((gate) => (
                            <li key={`${gate.dataset}-${gate.basis}`}>
                              <StatusPill status={gate.state} label={`${describeDataset(gate.dataset).label} · ${humanize(gate.basis).toLowerCase()}`} />
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    {connect ? <div>{connect}</div> : !connection ? <p className="bos-caption">Connecting a source needs the owner.</p> : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {orphanSnapshots.length > 0 ? (
        <Section title="Other imported data" description="Datasets not tied to a registered connection.">
          <Card pad>
            <DatasetList rows={orphanSnapshots} query={query} />
          </Card>
        </Section>
      ) : null}

      <div className="bos-grid-2" data-even="">
        <Section title="Recent sync runs">
          <Card className="overflow-hidden">
            {"error" in data.runs ? (
              <div className="p-4">
                <Notice>Sync runs are unavailable.</Notice>
              </div>
            ) : data.runs.rows.length === 0 ? (
              <EmptyState title="No sync runs yet." />
            ) : (
              <ul className="bos-rows">
                {data.runs.rows.map((run, index) => (
                  <li key={`${run.endpoint}-${index}`} className="bos-row">
                    <span className="bos-row__main">
                      <span className="bos-row__title bos-mono">{run.endpoint}</span>
                      <span className="bos-caption">
                        {formatDateTime(run.startedAt)}
                        {run.errorCode ? ` · ${humanize(run.errorCode)}` : ""}
                      </span>
                    </span>
                    <StatusPill status={run.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
        <Section title="Quarantine" description="Pages that failed validation and were held back.">
          <Card className="overflow-hidden">
            {"error" in data.quarantine ? (
              <div className="p-4">
                <Notice>Quarantine is unavailable.</Notice>
              </div>
            ) : data.quarantine.rows.length === 0 ? (
              <EmptyState title="Nothing in quarantine." />
            ) : (
              <ul className="bos-rows">
                {data.quarantine.rows.map((row, index) => (
                  <li key={`${row.endpoint}-${index}`} className="bos-row">
                    <span className="bos-row__main">
                      <span className="bos-row__title bos-mono">{row.endpoint}</span>
                      <span className="bos-caption">{formatDateTime(row.createdAt)}</span>
                    </span>
                    <StatusPill status="quarantined" label={humanize(row.reason)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
      </div>

      {"error" in data.gates ? <Notice>Dataset gates are unavailable.</Notice> : null}
    </div>
  );
}

function DatasetList({ rows, query }: { rows: SnapshotRow[]; query: WorkspaceQuery }) {
  return (
    <ul className="flex flex-col divide-y divide-[var(--color-border)]">
      {rows.map((row) => {
        const descriptor = describeDataset(row.dataset);
        const table = genericRows(row.body);
        return (
          <li key={row.snapshotId} className="flex items-center gap-3 py-2">
            <DatabaseIcon size={16} className="shrink-0 text-[var(--color-text-dim)]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{descriptor.label}</span>
              <span className="bos-caption block">as of {formatDateTime(row.dataAsOf, "unknown")}</span>
            </span>
            <StatusPill status={row.status} />
            <DatasetButton
              title={descriptor.label}
              notes={<Markdown size="sm">{descriptor.notes}</Markdown>}
              href={descriptor.section ? workspaceHref("/admin", query, { section: descriptor.section, metric: null }) : null}
              meta={[
                ["Dataset", row.dataset],
                ["Status", humanize(row.status)],
                ["Grain", row.grain ?? "—"],
                ["Timezone", row.timezone ?? "—"],
                ["Coverage", row.coverage ?? "—"],
                ["As of", formatDateTime(row.dataAsOf, "unknown")],
              ]}
              columns={table.columns}
              rows={table.rows}
              total={table.total}
            />
          </li>
        );
      })}
    </ul>
  );
}
