import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import type { IdentityProfile } from "@/lib/business-os/auth/authorize";
import { createUserClient } from "@/lib/business-os/db/client";
import { financeRpcCode } from "@/lib/business-os/finance/rpc-status";
import { londonDate, londonWallToUtc } from "@/lib/business-os/finance/london";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { selectAll } from "@/lib/business-os/brain/read";
import type { BankData } from "@/lib/business-os/bank/load";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";
import { parseReport, type FinancialReportView } from "@/lib/business-os/workspace/present";

export type ProjectRow = { id: string; slug: string; name: string; state: string; reportingEnabled: boolean };

export type ObservationRow = {
  id: string;
  projectSlug: string | null;
  recordType: string;
  status: string;
  quality: string;
  amount: string | null;
  currency: string | null;
  amountReason: string | null;
  occurredAt: string;
  formulaVersion: string;
  source: string | null;
  channel: string | null;
  store: string | null;
  processor: string | null;
  basis: string;
  revision: number;
  supersedesRevision: number | null;
  postingRole: string;
  components: { componentId: string; componentType: string; amount: string | null; currency: string | null; quality: string; reason: string | null; postingRole: string }[];
};

export type ExpenseRow = {
  id: string;
  workflowKind: string;
  sourceOwner: string;
  projectSlug: string | null;
  status: string;
  vendor: string | null;
  amount: string | null;
  currency: string | null;
  dueOn: string | null;
  paidOn: string | null;
  serviceOn: string | null;
  taxAmount: string | null;
  postedEntryId: string | null;
  allocations: { id: string; projectSlug: string | null; amount: string | null }[];
};

export type SnapshotRow = {
  dataset: string;
  snapshotId: string;
  status: string;
  grain: string | null;
  timezone: string | null;
  coverage: string | null;
  dataAsOf: string | null;
  projectSlug: string | null;
  connectionId?: string | null;
  body: unknown;
};

export type WorkspaceData = {
  projects: ProjectRow[];
  categories: { rows: { code: string; name: string }[] } | { error: string };
  company: { report: FinancialReportView | null; error: string | null };
  byProject: { slug: string; report: FinancialReportView | null; error: string | null }[];
  drill: { records: Record<string, unknown>[] } | { error: string } | null;
  observations: { rows: ObservationRow[] } | { error: string };
  expenses: { rows: ExpenseRow[] } | { error: string };
  snapshots: { rows: SnapshotRow[] } | { error: string };
  health: { rows: { connectionId: string; status: string; lastSuccessAt: string | null; lastErrorCode: string | null }[] } | { error: string };
  connections: { id: string; projectSlug: string | null; environment: string; baseUrl: string; secretReference: string }[];
  gates: { rows: { projectSlug: string | null; dataset: string; basis: string; state: string }[] } | { error: string };
  runs: { rows: { endpoint: string; status: string; errorCode: string | null; startedAt: string | null }[] } | { error: string };
  quarantine: { rows: { endpoint: string; reason: string; createdAt: string }[] } | { error: string };
  /** Monthly buckets ending with the selected window, for trend charts. Absent when not requested. */
  trend?: { report: FinancialReportView | null; error: string | null } | null;
  /** Timeline items from 30 days back to 14 days ahead, for Today. Absent when not requested. */
  upcoming?: { rows: UpcomingRow[] } | { error: string };
  /** Files for the data folder. Absent when not requested. */
  documents?: { rows: DocumentRow[] } | { error: string };
  /** Note titles and the link graph for the Brain. Absent when not requested. */
  notes?: { rows: NoteMeta[]; links: NoteLink[] } | { error: string };
  /** Bank balances, transactions and rules for the Bank tab. Absent when not requested. */
  bank?: BankData | { error: string };
  /** Result code of the redirect back from Revolut's consent page, shown once on the Bank tab. */
  bankNotice?: string | null;
};

export type DocumentRow = {
  id: string;
  title: string;
  folder: string;
  origin: "central" | "source";
  category: string | null;
  vendor: string | null;
  tags: string[];
  projectSlug: string | null;
  documentOn: string | null;
  mimeType: string | null;
  byteSize: number | null;
  uploadStatus: string;
  summary: string | null;
  createdAt: string;
};

/** Newest files loaded for the Files page; the page says so when the cap is reached. */
export const DOCUMENT_LIMIT = 1000;

export type NoteMeta = { id: string; title: string; key: string; folder: string; tags: string[]; documentId: string | null; updatedAt: string };
export type NoteLink = { from: string; toKey: string };

/** Notes and links loaded for the Brain; bodies are fetched when a note opens. */
export const NOTE_LIMIT = 5000;
export const NOTE_LINK_LIMIT = 30000;

export type UpcomingRow = { kind: string; sourceId: string; occursOn: string; title: string; projectSlug: string | null; editable: boolean };

/** Days of history and lookahead Today shows from the timeline. */
export const UPCOMING_BACK_DAYS = 30;
export const UPCOMING_AHEAD_DAYS = 14;

/** Observation rows fetched per window; the UI says so when the cap is reached. */
export const OBSERVATION_LIMIT = 500;

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function moneyText(value: unknown): string | null {
  return typeof value === "string" ? value : value === null || value === undefined ? null : null;
}

async function reportFor(
  actorId: string,
  query: Pick<WorkspaceQuery, "from" | "to" | "basis" | "grain">,
  project: string | null,
): Promise<{ report: FinancialReportView | null; error: string | null }> {
  const read = await readFinanceRpc("financial_report", {
    actor_id: actorId,
    payload: {
      project_slug: project,
      from: query.from,
      to: query.to,
      basis: query.basis,
      grain: query.grain,
    },
  });
  if ("error" in read) return { report: null, error: financeRpcCode(read.error.message ?? "") };
  return { report: parseReport(read.data), error: null };
}

/**
 * Twelve monthly buckets ending with the selected month, the months of the selected
 * year, or the months of a custom range longer than a month. Null when one bucket
 * would be all the chart had.
 */
export function trendWindow(query: WorkspaceQuery): Pick<WorkspaceQuery, "from" | "to" | "basis" | "grain"> | null {
  if (query.grain === "year") return { from: query.from, to: query.to, basis: query.basis, grain: "month" };
  if (query.grain === "month") {
    const year = Number(query.anchor.slice(0, 4));
    const month = Number(query.anchor.slice(5, 7));
    const start = new Date(Date.UTC(year, month - 12, 1));
    return {
      from: londonWallToUtc(start.getUTCFullYear(), start.getUTCMonth() + 1, 1).toISOString(),
      to: query.to,
      basis: query.basis,
      grain: "month",
    };
  }
  const days = (new Date(query.to).getTime() - new Date(query.from).getTime()) / 86_400_000;
  return days > 45 ? { from: query.from, to: query.to, basis: query.basis, grain: "month" } : null;
}

export async function loadWorkspace(
  profile: IdentityProfile,
  query: WorkspaceQuery,
  options: { trend?: boolean; upcoming?: boolean; documents?: boolean; notes?: boolean } = {},
): Promise<WorkspaceData> {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) {
    return emptyWorkspace("unauthenticated");
  }
  const db = createUserClient(access).schema("business_os");
  const projectResult = await db.from("projects").select("id, slug, name, state, reporting_enabled");
  const projects: ProjectRow[] = (projectResult.data ?? []).flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.slug !== "string" || typeof row.name !== "string") return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        state: typeof row.state === "string" ? row.state : "unverified",
        reportingEnabled: row.reporting_enabled === true,
      },
    ];
  });
  const projectById = new Map(projects.map((project) => [project.id, project.slug]));
  const slugs = query.project ? [query.project] : projects.map((project) => project.slug);
  const trendQuery = options.trend ? trendWindow(query) : null;
  const today = londonDate(new Date());
  const [company, byProject, categories, observations, components, expenses, allocations, snapshots, connections, health, gates, runs, quarantine, trend, upcoming, documents, noteRows, noteLinks] =
    await Promise.all([
      query.project ? Promise.resolve({ report: null, error: null }) : reportFor(profile.userId, query, null),
      Promise.all(slugs.map(async (slug) => ({ slug, ...(await reportFor(profile.userId, query, slug)) }))),
      db.from("expense_categories").select("code, name"),
      db
        .from("source_observations")
        .select(
          "id, project_id, record_type, status, quality, original_amount, original_currency, amount_reason, occurred_at, formula_version, source_system, channel, store, processor, recognition_basis, revision, supersedes_revision, posting_role",
        )
        .gte("occurred_at", query.from)
        .lt("occurred_at", query.to)
        .eq("recognition_basis", query.basis)
        .order("occurred_at", { ascending: false })
        .limit(OBSERVATION_LIMIT),
      db.from("observation_components").select("observation_id, component_id, component_type, amount, currency, quality, reason, posting_role"),
      db
        .from("expenses")
        .select("id, workflow_kind, source_owner, project_id, status, vendor, amount, currency, due_on, paid_on, service_on, tax_amount, posted_entry_id"),
      db.from("expense_allocations").select("id, expense_id, project_id, amount"),
      db
        .from("imported_snapshots")
        .select("dataset, snapshot_id, body, grain, timezone, coverage, data_as_of, status, connection_id")
        .in("status", ["current", "stale"]),
      db.from("source_connections").select("id, project_id, environment, base_url, secret_reference"),
      db.from("source_health").select("connection_id, status, last_success_at, last_error_code"),
      db.from("dataset_verifications").select("project_id, dataset, basis, state"),
      db.from("sync_runs").select("endpoint, status, error_code, started_at").order("started_at", { ascending: false }).limit(20),
      db.from("import_quarantine").select("endpoint, reason, created_at").order("created_at", { ascending: false }).limit(20),
      trendQuery ? reportFor(profile.userId, trendQuery, query.project) : Promise.resolve(null),
      options.upcoming
        ? db
            .from("timeline_items")
            .select("kind, source_id, occurs_on, title, project_id, editable")
            .gte("occurs_on", addDays(today, -UPCOMING_BACK_DAYS))
            .lte("occurs_on", addDays(today, UPCOMING_AHEAD_DAYS))
            .order("occurs_on", { ascending: true })
            .limit(40)
        : Promise.resolve(null),
      options.documents
        ? db
            .from("documents")
            .select("id, title, folder, origin, category, vendor, tags, project_id, document_on, mime_type, byte_size, upload_status, summary, created_at")
            .neq("upload_status", "orphaned")
            .order("created_at", { ascending: false })
            .limit(DOCUMENT_LIMIT)
        : Promise.resolve(null),
      options.notes
        ? selectAll<Record<string, unknown>>(
            (from, to) => db.from("notes").select("id, title, link_key, folder, tags, document_id, updated_at").order("updated_at", { ascending: false }).order("id").range(from, to),
            NOTE_LIMIT,
          )
        : Promise.resolve(null),
      options.notes
        ? selectAll<Record<string, unknown>>((from, to) => db.from("note_links").select("from_note, to_key").order("from_note").order("to_key").range(from, to), NOTE_LINK_LIMIT)
        : Promise.resolve(null),
    ]);

  let drill: WorkspaceData["drill"] = null;
  if (query.metric) {
    const read = await readFinanceRpc("report_drill", {
      actor_id: profile.userId,
      payload: {
        project_slug: query.project,
        from: query.from,
        to: query.to,
        basis: query.basis,
        metric: query.metric,
      },
    });
    if ("error" in read) drill = { error: financeRpcCode(read.error.message ?? "") };
    else {
      const body = read.data && typeof read.data === "object" ? (read.data as { records?: unknown }).records : null;
      drill = { records: Array.isArray(body) ? body.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [] };
    }
  }

  const componentRows = components.error ? [] : (components.data ?? []);
  const componentsByObservation = new Map<string, ObservationRow["components"]>();
  for (const row of componentRows) {
    const observationId = text(row.observation_id);
    if (!observationId) continue;
    const list = componentsByObservation.get(observationId) ?? [];
    list.push({
      componentId: text(row.component_id) ?? "",
      componentType: text(row.component_type) ?? "",
      amount: moneyText(row.amount),
      currency: text(row.currency),
      quality: text(row.quality) ?? "unavailable",
      reason: text(row.reason),
      postingRole: text(row.posting_role) ?? "",
    });
    componentsByObservation.set(observationId, list);
  }

  const allocationRows = allocations.error ? [] : (allocations.data ?? []);
  const allocationsByExpense = new Map<string, ExpenseRow["allocations"]>();
  for (const row of allocationRows) {
    const expenseId = text(row.expense_id);
    if (!expenseId) continue;
    const list = allocationsByExpense.get(expenseId) ?? [];
    list.push({
      id: text(row.id) ?? "",
      projectSlug: text(row.project_id) ? (projectById.get(text(row.project_id) as string) ?? null) : null,
      amount: moneyText(row.amount),
    });
    allocationsByExpense.set(expenseId, list);
  }

  const connectionRows = connections.error ? [] : (connections.data ?? []);
  const connectionProject = new Map<string, string | null>();
  for (const row of connectionRows) {
    if (typeof row.id === "string") connectionProject.set(row.id, projectById.get(String(row.project_id)) ?? null);
  }

  return {
    projects,
    categories: categories.error
      ? { error: "unavailable" }
      : {
          rows: (categories.data ?? []).flatMap((row) =>
            typeof row.code === "string" && typeof row.name === "string" ? [{ code: row.code, name: row.name }] : [],
          ),
        },
    company,
    byProject,
    drill,
    observations: observations.error
      ? { error: "unavailable" }
      : {
          rows: (observations.data ?? []).flatMap((row) => {
            const id = text(row.id);
            const occurredAt = text(row.occurred_at);
            if (!id || !occurredAt) return [];
            return [
              {
                id,
                projectSlug: text(row.project_id) ? (projectById.get(text(row.project_id) as string) ?? null) : null,
                recordType: text(row.record_type) ?? "",
                status: text(row.status) ?? "",
                quality: text(row.quality) ?? "unavailable",
                amount: moneyText(row.original_amount),
                currency: text(row.original_currency),
                amountReason: text(row.amount_reason),
                occurredAt,
                formulaVersion: text(row.formula_version) ?? "",
                source: text(row.source_system),
                channel: text(row.channel),
                store: text(row.store),
                processor: text(row.processor),
                basis: text(row.recognition_basis) ?? "",
                revision: typeof row.revision === "number" ? row.revision : 0,
                supersedesRevision: typeof row.supersedes_revision === "number" ? row.supersedes_revision : null,
                postingRole: text(row.posting_role) ?? "",
                components: componentsByObservation.get(id) ?? [],
              },
            ];
          }),
        },
    expenses: expenses.error
      ? { error: "unavailable" }
      : {
          rows: (expenses.data ?? []).flatMap((row) => {
            const id = text(row.id);
            if (!id) return [];
            return [
              {
                id,
                workflowKind: text(row.workflow_kind) ?? "",
                sourceOwner: text(row.source_owner) ?? "",
                projectSlug: text(row.project_id) ? (projectById.get(text(row.project_id) as string) ?? null) : null,
                status: text(row.status) ?? "",
                vendor: text(row.vendor),
                amount: moneyText(row.amount),
                currency: text(row.currency),
                dueOn: text(row.due_on),
                paidOn: text(row.paid_on),
                serviceOn: text(row.service_on),
                taxAmount: moneyText(row.tax_amount),
                postedEntryId: text(row.posted_entry_id),
                allocations: allocationsByExpense.get(id) ?? [],
              },
            ];
          }),
        },
    snapshots: snapshots.error
      ? { error: "unavailable" }
      : {
          rows: (snapshots.data ?? []).flatMap((row) => {
            const dataset = text(row.dataset);
            const snapshotId = text(row.snapshot_id);
            const status = text(row.status);
            if (!dataset || !snapshotId || !status) return [];
            return [
              {
                dataset,
                snapshotId,
                status,
                grain: text(row.grain),
                timezone: text(row.timezone),
                coverage: text(row.coverage),
                dataAsOf: text(row.data_as_of),
                projectSlug: text(row.connection_id) ? (connectionProject.get(text(row.connection_id) as string) ?? null) : null,
                connectionId: text(row.connection_id),
                body: row.body,
              },
            ];
          }),
        },
    health: health.error
      ? { error: "unavailable" }
      : {
          rows: (health.data ?? []).flatMap((row) => {
            const connectionId = text(row.connection_id);
            const status = text(row.status);
            if (!connectionId || !status) return [];
            return [{ connectionId, status, lastSuccessAt: text(row.last_success_at), lastErrorCode: text(row.last_error_code) }];
          }),
        },
    connections: connectionRows.flatMap((row) => {
      const id = text(row.id);
      const environment = text(row.environment);
      const baseUrl = text(row.base_url);
      const secretReference = text(row.secret_reference);
      if (!id || !environment || !baseUrl || !secretReference) return [];
      return [{ id, projectSlug: text(row.project_id) ? (projectById.get(text(row.project_id) as string) ?? null) : null, environment, baseUrl, secretReference }];
    }),
    gates: gates.error
      ? { error: "unavailable" }
      : {
          rows: (gates.data ?? []).flatMap((row) => {
            const dataset = text(row.dataset);
            const basis = text(row.basis);
            const state = text(row.state);
            if (!dataset || !basis || !state) return [];
            return [{ projectSlug: text(row.project_id) ? (projectById.get(text(row.project_id) as string) ?? null) : null, dataset, basis, state }];
          }),
        },
    runs: runs.error
      ? { error: "unavailable" }
      : {
          rows: (runs.data ?? []).flatMap((row) => {
            const endpoint = text(row.endpoint);
            const status = text(row.status);
            if (!endpoint || !status) return [];
            return [{ endpoint, status, errorCode: text(row.error_code), startedAt: text(row.started_at) }];
          }),
        },
    quarantine: quarantine.error
      ? { error: "unavailable" }
      : {
          rows: (quarantine.data ?? []).flatMap((row) => {
            const endpoint = text(row.endpoint);
            const reason = text(row.reason);
            const createdAt = text(row.created_at);
            if (!endpoint || !reason || !createdAt) return [];
            return [{ endpoint, reason, createdAt }];
          }),
        },
    trend,
    ...(upcoming
      ? {
          upcoming: upcoming.error
            ? { error: "unavailable" }
            : {
                rows: (upcoming.data ?? []).flatMap((row) => {
                  const kind = text(row.kind);
                  const sourceId = text(row.source_id);
                  const occursOn = text(row.occurs_on);
                  const title = text(row.title);
                  if (!kind || !sourceId || !occursOn || !title) return [];
                  const projectId = text(row.project_id);
                  return [{ kind, sourceId, occursOn, title, projectSlug: projectId ? (projectById.get(projectId) ?? null) : null, editable: row.editable === true }];
                }),
              },
        }
      : {}),
    ...(documents
      ? {
          documents: documents.error
            ? { error: "unavailable" }
            : {
                rows: (documents.data ?? []).flatMap((row): DocumentRow[] => {
                  const id = text(row.id);
                  const title = text(row.title);
                  const createdAt = text(row.created_at);
                  const uploadStatus = text(row.upload_status);
                  if (!id || !title || !createdAt || !uploadStatus) return [];
                  const projectId = text(row.project_id);
                  return [
                    {
                      id,
                      title,
                      folder: text(row.folder) ?? "",
                      origin: row.origin === "source" ? "source" : "central",
                      category: text(row.category),
                      vendor: text(row.vendor),
                      tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
                      projectSlug: projectId ? (projectById.get(projectId) ?? null) : null,
                      documentOn: text(row.document_on),
                      mimeType: text(row.mime_type),
                      byteSize: typeof row.byte_size === "number" ? row.byte_size : null,
                      uploadStatus,
                      summary: text(row.summary),
                      createdAt,
                    },
                  ];
                }),
              },
        }
      : {}),
    ...(options.notes
      ? {
          notes:
            noteRows === null || noteLinks === null
              ? { error: "unavailable" }
              : {
                  rows: noteRows.flatMap((row): NoteMeta[] => {
                    const id = text(row.id);
                    const title = text(row.title);
                    const key = text(row.link_key);
                    const updatedAt = text(row.updated_at);
                    if (!id || !title || !key || !updatedAt) return [];
                    return [
                      {
                        id,
                        title,
                        key,
                        folder: text(row.folder) ?? "",
                        tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
                        documentId: text(row.document_id),
                        updatedAt,
                      },
                    ];
                  }),
                  links: noteLinks.flatMap((row): NoteLink[] => {
                    const from = text(row.from_note);
                    const toKey = text(row.to_key);
                    return from && toKey ? [{ from, toKey }] : [];
                  }),
                },
        }
      : {}),
  };
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function emptyWorkspace(error: string): WorkspaceData {
  return {
    projects: [],
    categories: { error },
    company: { report: null, error },
    byProject: [],
    drill: null,
    observations: { error },
    expenses: { error },
    snapshots: { error },
    health: { error },
    connections: [],
    gates: { error },
    runs: { error },
    quarantine: { error },
  };
}
