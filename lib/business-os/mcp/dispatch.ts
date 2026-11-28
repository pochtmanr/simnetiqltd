import "server-only";
import { parseCalendarCreate, parseCalendarDelete, parseCalendarUpdate } from "@/lib/business-os/calendar/body";
import { CHECKLIST_FOLDER, CHECKLIST_TAGS, checklistProgress, checklistRows } from "@/lib/business-os/company/checklist";
import { addDays, upcomingDeadlines } from "@/lib/business-os/company/deadlines";
import { createSecretClient } from "@/lib/business-os/db/client";
import { londonDate } from "@/lib/business-os/finance/london";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { companyCopyFields, companyDatesFrom, COMPANY_PROFILE, companyFullAddress, type CompanyProfileRow } from "@/lib/business-os/company/profile";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { MAX_FILE_BYTES, mimeFromName, normalizeFolder, parseTags, titleFromName } from "@/lib/business-os/files/kinds";
import { wouldExceedQuota } from "@/lib/business-os/files/quota";
import { readStorageUsage } from "@/lib/business-os/files/usage";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { signDocumentAccess } from "@/lib/business-os/operations/documents";
import type { McpTokenKind } from "@/lib/business-os/mcp/auth";

/** Every tool and whether it changes anything. A read token may only call the "read" ones. */
export const MCP_TOOL_ACCESS = {
  company_profile_get: "read",
  company_profile_update: "write",
  checklist_get: "read",
  documents_list: "read",
  documents_search: "read",
  documents_get: "read",
  documents_usage: "read",
  documents_register_upload: "write",
  documents_complete_upload: "write",
  documents_update: "write",
  documents_delete: "write",
  documents_file_url: "read",
  tasks_list: "read",
  tasks_save: "write",
  tasks_delete: "write",
  calendar_list: "read",
  calendar_save: "write",
  calendar_delete: "write",
} as const satisfies Record<string, McpTokenKind>;

export type McpToolName = keyof typeof MCP_TOOL_ACCESS;
export const MCP_TOOLS = Object.keys(MCP_TOOL_ACCESS) as McpToolName[];

export type McpResult = { ok: true; result: unknown } | { ok: false; error: string; status: number };

function ok(result: unknown): McpResult {
  return { ok: true, result };
}

function fail(error: string, status: number): McpResult {
  return { ok: false, error, status };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** RPC errors that are the caller's mistake, by the code the database raised. */
function rpcFail(error: { message?: string }): McpResult {
  const message = error.message ?? "";
  const code = message.match(/\b(task|calendar|company_profile)_[a-z_]+\b/)?.[0];
  if (code) return fail(code, 400);
  if (message.includes("document_missing")) return fail("not_found", 404);
  if (message.includes("reader_forbidden")) return fail("forbidden", 403);
  return fail("unavailable", 500);
}

/** Argument names and short scalar values for the activity log. File contents and long text never go in. */
export function activitySummary(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}: ${value.length > 60 ? `${value.slice(0, 57)}…` : value}`;
      if (typeof value === "number" || typeof value === "boolean") return `${key}: ${value}`;
      return key;
    })
    .join(", ")
    .slice(0, 500);
}

function londonToday(): string {
  return londonDate(new Date());
}

function documentsStorage() {
  return createSecretClient().storage.from(DOCUMENTS_BUCKET);
}

export async function dispatchMcpTool(tool: string, args: Record<string, unknown>, caller: { actorId: string; kind: McpTokenKind }): Promise<McpResult> {
  if (!Object.hasOwn(MCP_TOOL_ACCESS, tool)) return fail("unknown_tool", 400);
  if (MCP_TOOL_ACCESS[tool as McpToolName] === "write" && caller.kind !== "write") return fail("read_only_token", 403);
  const actorId = caller.actorId;

  switch (tool as McpToolName) {
    case "company_profile_get": {
      const saved = await readFinanceRpc("company_profile", { actor_id: actorId });
      if ("error" in saved) return rpcFail(saved.error);
      return ok({ saved: saved.data, published: COMPANY_PROFILE, fullAddress: companyFullAddress(), fields: companyCopyFields() });
    }

    case "company_profile_update": {
      const payload: Record<string, unknown> = {};
      for (const [key, column] of [
        ["legalName", "legal_name"],
        ["jurisdiction", "jurisdiction"],
        ["companyNumber", "company_number"],
        ["utr", "utr"],
        ["address", "address"],
        ["incorporatedOn", "incorporated_on"],
        ["yearEndMonth", "year_end_month"],
        ["yearEndDay", "year_end_day"],
        ["vatNumber", "vat_number"],
        ["vatStagger", "vat_stagger"],
        ["directorName", "director_name"],
      ] as const) {
        if (!(key in args)) continue;
        const value = args[key];
        if (value !== null && typeof value !== "string" && typeof value !== "number") return fail("invalid_body", 400);
        payload[column] = value === null ? "" : String(value);
      }
      if (Object.keys(payload).length === 0) return fail("invalid_body", 400);
      const saved = await readFinanceRpc("save_company_profile", { actor_id: actorId, payload });
      return "error" in saved ? rpcFail(saved.error) : ok(saved.data);
    }

    case "checklist_get": {
      const [tagged, saved] = await Promise.all([
        readFinanceRpc("list_documents", { actor_id: actorId, folder_path: null, with_tags: CHECKLIST_TAGS, max_rows: 500 }),
        readFinanceRpc("company_profile", { actor_id: actorId }),
      ]);
      if ("error" in tagged) return rpcFail(tagged.error);
      const filesByTag: Record<string, { id: string; title: string }[]> = {};
      for (const row of (tagged.data ?? []) as { id: string; title: string; tags: string[]; uploadStatus: string }[]) {
        if (row.uploadStatus !== "stored") continue;
        for (const tag of row.tags) if (CHECKLIST_TAGS.includes(tag)) (filesByTag[tag] ??= []).push({ id: row.id, title: row.title });
      }
      const today = londonToday();
      const rows = checklistRows(filesByTag, today);
      const dates = companyDatesFrom("error" in saved ? null : (saved.data as CompanyProfileRow | null));
      return ok({
        today,
        progress: checklistProgress(rows),
        folder: CHECKLIST_FOLDER,
        rows: rows.map(({ tag, group, level, title, state, files, where }) => ({ tag, group, level, title, state, files, where })),
        deadlines: upcomingDeadlines(dates, today, 12),
      });
    }

    case "tasks_list": {
      const read = await readFinanceRpc("list_tasks", { actor_id: actorId, include_closed: args.includeClosed === true });
      return "error" in read ? rpcFail(read.error) : ok({ tasks: read.data });
    }

    case "tasks_save": {
      const payload: Record<string, unknown> = {};
      if ("id" in args) {
        if (!isUuid(args.id)) return fail("invalid_body", 400);
        payload.id = args.id;
      }
      for (const [key, column] of [
        ["title", "title"],
        ["notes", "notes"],
        ["dueOn", "due_on"],
        ["status", "status"],
        ["assignee", "assignee"],
        ["project", "project_slug"],
      ] as const) {
        if (!(key in args)) continue;
        const value = args[key];
        if (value !== null && typeof value !== "string") return fail("invalid_body", 400);
        payload[column] = value ?? "";
      }
      const saved = await readFinanceRpc("save_task", { actor_id: actorId, payload });
      return "error" in saved ? rpcFail(saved.error) : ok(saved.data);
    }

    case "tasks_delete": {
      if (!isUuid(args.taskId)) return fail("invalid_body", 400);
      const removed = await readFinanceRpc("delete_task", { actor_id: actorId, task_id: args.taskId });
      return "error" in removed ? rpcFail(removed.error) : ok(removed.data);
    }

    case "calendar_list": {
      const day = /^\d{4}-\d{2}-\d{2}$/;
      const from = text(args.from) ?? londonToday();
      if (!day.test(from)) return fail("calendar_dates_invalid", 400);
      const to = text(args.to) ?? addDays(from, 90);
      if (!day.test(to)) return fail("calendar_dates_invalid", 400);
      const read = await readFinanceRpc("list_calendar_events", { actor_id: actorId, from_date: from, to_date: to });
      return "error" in read ? rpcFail(read.error) : ok({ from, to, events: read.data });
    }

    case "calendar_save": {
      const parsed = "id" in args ? parseCalendarUpdate(args) : parseCalendarCreate(args);
      if ("error" in parsed) return fail(parsed.error, 400);
      const saved = await readFinanceRpc("id" in args ? "update_calendar_event" : "create_calendar_event", { actor_id: actorId, payload: parsed.payload });
      return "error" in saved ? rpcFail(saved.error) : ok(saved.data);
    }

    case "calendar_delete": {
      const parsed = parseCalendarDelete({ id: args.eventId });
      if ("error" in parsed) return fail(parsed.error, 400);
      const removed = await readFinanceRpc("delete_calendar_event", { actor_id: actorId, payload: parsed.payload });
      return "error" in removed ? rpcFail(removed.error) : ok(removed.data);
    }

    case "documents_usage": {
      const usage = await readStorageUsage(actorId);
      if ("error" in usage) return fail("unavailable", 500);
      return ok(usage);
    }

    case "documents_list": {
      const folder = typeof args.folder === "string" ? normalizeFolder(args.folder) : "";
      if (folder === null) return fail("folder_invalid", 400);
      const tags = "tags" in args ? parseTags(Array.isArray(args.tags) ? args.tags.filter((tag): tag is string => typeof tag === "string") : (text(args.tags) ?? "")) : [];
      if (tags === null) return fail("tag_invalid", 400);
      const limit = typeof args.limit === "number" && Number.isInteger(args.limit) ? args.limit : 100;
      const read = await readFinanceRpc("list_documents", { actor_id: actorId, folder_path: folder || null, with_tags: tags.length > 0 ? tags : null, max_rows: limit });
      return "error" in read ? rpcFail(read.error) : ok({ rows: read.data });
    }

    case "documents_search": {
      const q = text(args.q);
      if (!q || q.length > 200) return fail("query_invalid", 400);
      const read = await readFinanceRpc("search_documents", { actor_id: actorId, search_text: q, max_rows: 50 });
      if ("error" in read) return fail("unavailable", 500);
      return ok(read.data);
    }

    case "documents_get": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      const read = await readFinanceRpc("get_document", { actor_id: actorId, document_id: args.documentId });
      return "error" in read ? rpcFail(read.error) : ok(read.data);
    }

    case "documents_register_upload": {
      const fileName = text(args.fileName);
      const mime = fileName ? mimeFromName(fileName) : null;
      if (!fileName || !mime) return fail("mime_invalid", 400);
      const size = args.size;
      if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
        return fail("document_too_large", 400);
      }
      if (typeof args.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(args.sha256)) return fail("checksum_invalid", 400);
      const folder = normalizeFolder(typeof args.folder === "string" ? args.folder : "");
      if (folder === null) return fail("folder_invalid", 400);
      const tags = parseTags(Array.isArray(args.tags) ? args.tags.filter((tag): tag is string => typeof tag === "string") : (text(args.tags) ?? ""));
      if (tags === null) return fail("tag_invalid", 400);
      const usage = await readStorageUsage(actorId);
      if ("error" in usage) return fail("unavailable", 500);
      if (wouldExceedQuota(usage.usedBytes, size)) return fail("storage_quota_exceeded", 413);

      const created = await readFinanceRpc("register_upload", {
        actor_id: actorId,
        payload: {
          title: text(args.title) ?? titleFromName(fileName),
          folder,
          tags,
          category: text(args.category),
          vendor: text(args.vendor),
          project_slug: text(args.project),
          document_on: text(args.documentOn),
          mime_type: mime,
          byte_size: size,
        },
      });
      if ("error" in created) return fail("unavailable", 500);
      const registered = created.data as { id?: string; objectPath?: string } | null;
      if (!registered?.id || !registered.objectPath) return fail("unavailable", 500);
      const signed = await documentsStorage().createSignedUploadUrl(registered.objectPath);
      if (signed.error || !signed.data?.signedUrl) return fail("upload_incomplete", 502);
      return ok({
        documentId: registered.id,
        uploadUrl: signed.data.signedUrl,
        mime,
        apikey: requireBusinessOsConfig().publishableKey,
      });
    }

    case "documents_complete_upload": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      if (typeof args.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(args.sha256)) return fail("checksum_invalid", 400);
      const { completeDocumentUpload } = await import("@/lib/business-os/mcp/complete");
      return completeDocumentUpload(actorId, args.documentId as string, text(args.fileName), args.sha256 as string);
    }

    case "documents_update": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      const payload: Record<string, unknown> = {};
      for (const [key, column] of [
        ["title", "title"],
        ["category", "category"],
        ["vendor", "vendor"],
        ["project", "project_slug"],
        ["documentOn", "document_on"],
      ] as const) {
        if (!(key in args)) continue;
        const value = args[key];
        if (value !== null && typeof value !== "string") return fail("invalid_body", 400);
        payload[column] = typeof value === "string" ? value.trim() : "";
      }
      if ("folder" in args) {
        const folder = typeof args.folder === "string" ? normalizeFolder(args.folder) : null;
        if (folder === null) return fail("folder_invalid", 400);
        payload.folder = folder;
      }
      if ("tags" in args) {
        const tags = typeof args.tags === "string" || Array.isArray(args.tags) ? parseTags(args.tags as string | string[]) : null;
        if (tags === null) return fail("tag_invalid", 400);
        payload.tags = tags;
      }
      const updated = await readFinanceRpc("update_document", { actor_id: actorId, document_id: args.documentId, payload });
      if ("error" in updated) return fail("unavailable", 500);
      return ok(updated.data);
    }

    case "documents_delete": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      const deleted = await readFinanceRpc("delete_document", { actor_id: actorId, document_id: args.documentId });
      if ("error" in deleted) {
        if (deleted.error.message?.includes("document_linked")) return fail("document_linked", 409);
        return fail("unavailable", 500);
      }
      const objectPath = (deleted.data as { objectPath?: string | null } | null)?.objectPath;
      const removed = objectPath ? await documentsStorage().remove([objectPath]) : null;
      return ok({ id: args.documentId, bytesRemoved: removed ? !removed.error : true });
    }

    case "documents_file_url": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      const key = process.env.BUSINESS_OS_JOB_SECRET?.trim();
      if (!key) return fail("business_os_unconfigured", 503);
      const authorized = await readFinanceRpc("authorize_document", { actor_id: actorId, document_id: args.documentId });
      if ("error" in authorized) return fail("unavailable", 500);
      const row = authorized.data as { uploadStatus?: string; origin?: string; objectPath?: string | null } | null;
      if (!row || (row.origin === "central" && row.uploadStatus !== "stored")) return fail("upload_incomplete", 400);
      if (row.origin === "source") return fail("source_bytes_unavailable", 409);
      if (!row.objectPath) return fail("upload_incomplete", 400);
      const signed = await documentsStorage().createSignedUrl(row.objectPath, 60, {
        download: args.preview === true ? false : true,
      });
      if (signed.error || !signed.data?.signedUrl) return fail("unavailable", 404);
      const token = signDocumentAccess(key, args.documentId as string, Date.now());
      const preview = args.preview === true ? "&preview=1" : "";
      return ok({
        signedUrl: signed.data.signedUrl,
        appPath: `/api/business-os/documents/file?token=${encodeURIComponent(token)}${preview}`,
      });
    }

    default:
      return fail("unknown_tool", 400);
  }
}
