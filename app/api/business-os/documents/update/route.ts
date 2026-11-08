import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { normalizeFolder, parseTags } from "@/lib/business-os/files/kinds";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

const OPTIONAL_TEXT = ["title", "category", "vendor", "project", "documentOn"] as const;
const COLUMN: Record<(typeof OPTIONAL_TEXT)[number], string> = {
  title: "title",
  category: "category",
  vendor: "vendor",
  project: "project_slug",
  documentOn: "document_on",
};

/** Edit metadata or move a file to another folder. Only the keys sent are changed. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request, "files");
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.documentId)) return jsonError("invalid_body", 400);
  const payload: Record<string, unknown> = {};
  for (const key of OPTIONAL_TEXT) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value !== null && typeof value !== "string") return jsonError("invalid_body", 400);
    payload[COLUMN[key]] = typeof value === "string" ? value.trim() : "";
  }
  if ("folder" in body) {
    const folder = typeof body.folder === "string" ? normalizeFolder(body.folder) : null;
    if (folder === null) return jsonError("folder_invalid", 400);
    payload.folder = folder;
  }
  if ("tags" in body) {
    const tags = typeof body.tags === "string" || Array.isArray(body.tags) ? parseTags(body.tags as string | string[]) : null;
    if (tags === null) return jsonError("tag_invalid", 400);
    payload.tags = tags;
  }
  return operationsRpc("update_document", { actor_id: profile.userId, document_id: body.documentId, payload });
}
