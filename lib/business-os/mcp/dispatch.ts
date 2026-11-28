import "server-only";
import { createSecretClient } from "@/lib/business-os/db/client";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { companyCopyFields, COMPANY_PROFILE, companyFullAddress } from "@/lib/business-os/company/profile";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { MAX_FILE_BYTES, mimeFromName, normalizeFolder, parseTags, titleFromName } from "@/lib/business-os/files/kinds";
import { wouldExceedQuota } from "@/lib/business-os/files/quota";
import { readStorageUsage } from "@/lib/business-os/files/usage";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { signDocumentAccess } from "@/lib/business-os/operations/documents";
import { resolveMcpActorId } from "@/lib/business-os/mcp/auth";

export const MCP_TOOLS = [
  "company_profile_get",
  "documents_list",
  "documents_search",
  "documents_get",
  "documents_usage",
  "documents_register_upload",
  "documents_complete_upload",
  "documents_update",
  "documents_delete",
  "documents_file_url",
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number];

export type McpResult = { ok: true; result: unknown } | { ok: false; error: string; status: number };

const DOCUMENT_LIST_COLUMNS =
  "id, title, folder, origin, category, vendor, tags, mime_type, byte_size, upload_status, summary, created_at, document_on";

const DOCUMENT_GET_COLUMNS = `${DOCUMENT_LIST_COLUMNS}, object_path, extracted_text`;

function ok(result: unknown): McpResult {
  return { ok: true, result };
}

function fail(error: string, status: number): McpResult {
  return { ok: false, error, status };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function requireActor(): Promise<string | McpResult> {
  const id = await resolveMcpActorId();
  if (!id) return fail("mcp_actor_missing", 503);
  return id;
}

function documentsTable() {
  return createSecretClient().schema("business_os").from("documents");
}

function documentsStorage() {
  return createSecretClient().storage.from(DOCUMENTS_BUCKET);
}

export async function dispatchMcpTool(tool: string, args: Record<string, unknown>): Promise<McpResult> {
  if (!(MCP_TOOLS as readonly string[]).includes(tool)) return fail("unknown_tool", 400);

  switch (tool as McpToolName) {
    case "company_profile_get":
      return ok({
        profile: COMPANY_PROFILE,
        fullAddress: companyFullAddress(),
        fields: companyCopyFields(),
      });

    case "documents_usage": {
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
      const usage = await readStorageUsage(actorId);
      if ("error" in usage) return fail("unavailable", 500);
      return ok(usage);
    }

    case "documents_list": {
      const folder = typeof args.folder === "string" ? normalizeFolder(args.folder) : "";
      if (folder === null) return fail("folder_invalid", 400);
      const limit = typeof args.limit === "number" && Number.isInteger(args.limit) ? Math.min(Math.max(args.limit, 1), 500) : 100;
      let query = documentsTable().select(DOCUMENT_LIST_COLUMNS).order("created_at", { ascending: false }).limit(limit);
      if (folder) query = query.eq("folder", folder);
      const result = await query;
      if (result.error) return fail("unavailable", 500);
      return ok({ rows: result.data ?? [] });
    }

    case "documents_search": {
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
      const q = text(args.q);
      if (!q || q.length > 200) return fail("query_invalid", 400);
      const read = await readFinanceRpc("search_documents", { actor_id: actorId, search_text: q, max_rows: 50 });
      if ("error" in read) return fail("unavailable", 500);
      return ok(read.data);
    }

    case "documents_get": {
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      const result = await documentsTable().select(DOCUMENT_GET_COLUMNS).eq("id", args.documentId).maybeSingle();
      if (result.error) return fail("unavailable", 500);
      if (!result.data) return fail("not_found", 404);
      return ok(result.data);
    }

    case "documents_register_upload": {
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
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
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
      if (!isUuid(args.documentId)) return fail("invalid_body", 400);
      if (typeof args.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(args.sha256)) return fail("checksum_invalid", 400);
      const { completeDocumentUpload } = await import("@/lib/business-os/mcp/complete");
      return completeDocumentUpload(actorId, args.documentId as string, text(args.fileName), args.sha256 as string);
    }

    case "documents_update": {
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
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
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
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
      const actorId = await requireActor();
      if (typeof actorId !== "string") return actorId;
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
