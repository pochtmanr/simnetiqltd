import { DatasetButton } from "@/components/business-os/admin/sections/dataset-button";
import { IdentityActions } from "@/components/business-os/identity-actions";
import { DatabaseIcon, SourcesIcon } from "@/components/business-os/ui/icons";
import { Markdown } from "@/components/business-os/ui/markdown";
import { SheetButton } from "@/components/business-os/ui/overlay";
import { Card, CardHead, EmptyState, KeyValues, Notice, Section, StatusPill } from "@/components/business-os/ui/primitives";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { workspaceHref, type WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { formatDateTime, humanize, relativeTime } from "@/lib/business-os/workspace/format";
import type { SnapshotRow, WorkspaceData } from "@/lib/business-os/workspace/load";
import { describeDataset, genericRows } from "@/lib/business-os/workspace/sources";

/**
 * Sources: one card per connection with its health, datasets and gates, then
 * sync runs and quarantine. Datasets come from what was imported, so a new
 * integration appears here without UI changes.
 */
export function Sources({ query, data, profile, telegramConfigured }: { query: WorkspaceQuery; data: WorkspaceData; profile: IdentityProfile; telegramConfigured: boolean }) {
  const healthRows = "error" in data.health ? null : data.health.rows;
  const snapshots = "error" in data.snapshots ? [] : data.snapshots.rows;
  const gates = "error" in data.gates ? [] : data.gates.rows;
  const orphanSnapshots = snapshots.filter((row) => !row.connectionId || !data.connections.some((connection) => connection.id === row.connectionId));

  return (
    <div className="flex flex-col gap-8">
      {healthRows === null ? <Notice>Source health is unavailable.</Notice> : null}

      <Section
        title="Connections"
        description="Each connection pulls signed data from one project and environment."
        actions={
          <SheetButton title="Integration reference" size="sm" label="Add reference">
            <IdentityActions role={profile.role} assurance={profile.assurance} surface="admin" telegramConfigured={telegramConfigured} focus="integration" projects={data.projects} />
          </SheetButton>
        }
      >
        {data.connections.length === 0 ? (
          <Card>
            <EmptyState icon={<SourcesIcon />} title="No sources yet">
              No source connection is registered. Register one through the sync API, then it appears here with its health and datasets.
            </EmptyState>
          </Card>
        ) : (
          <div className="bos-grid-3">
            {data.connections.map((connection) => {
              const health = healthRows?.find((row) => row.connectionId === connection.id);
              const status = health?.status ?? (healthRows ? "unconfigured" : "unavailable");
              const datasets = snapshots.filter((row) => row.connectionId === connection.id);
              const projectGates = gates.filter((gate) => gate.projectSlug === connection.projectSlug);
              const name = data.projects.find((project) => project.slug === connection.projectSlug)?.name ?? connection.projectSlug ?? "Unassigned";
              return (
                <Card key={connection.id} as="article">
                  <CardHead title={name} meta={humanize(connection.environment)} actions={<StatusPill status={status} />} />
                  <div className="flex flex-col gap-4 p-4 md:p-5">
                    <KeyValues
                      rows={[
                        ["Last sync", <span key="s" title={health?.lastSuccessAt ?? undefined}>{health?.lastSuccessAt ? relativeTime(health.lastSuccessAt) : "Never"}</span>],
                        ["Last error", health?.lastErrorCode ? humanize(health.lastErrorCode) : "None"],
                        ["Endpoint", <span key="u" className="bos-mono break-all">{connection.baseUrl}</span>],
                        ["Secret reference", <span key="r" className="bos-mono break-all">{connection.secretReference}</span>],
                      ]}
                    />
                    <div className="flex flex-col gap-2">
                      <p className="bos-label">Datasets</p>
                      {datasets.length === 0 ? <p className="bos-caption">Nothing imported yet.</p> : <DatasetList rows={datasets} query={query} />}
                    </div>
                    {projectGates.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="bos-label">Verification gates</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {projectGates.map((gate) => (
                            <li key={`${gate.dataset}-${gate.basis}`}>
                              <StatusPill status={gate.state} label={`${describeDataset(gate.dataset).label} · ${humanize(gate.basis).toLowerCase()}`} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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
