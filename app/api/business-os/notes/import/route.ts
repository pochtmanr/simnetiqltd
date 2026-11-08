import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapRpcError } from "@/lib/business-os/auth/http";
import { IMPORT_BATCH, prepareNote, type PreparedNote } from "@/lib/business-os/brain/prepare";
import { folderFromPath, titleFromPath } from "@/lib/business-os/brain/wikilinks";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

/**
 * One batch of an Obsidian vault import: up to 200 markdown files as
 * `{ path, body }`. Notes are upserted by title; a file whose name cannot be a
 * note title, or that is too large, is skipped and reported.
 */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request, "files");
  if (profile instanceof NextResponse) return profile;
  let body: { files?: unknown; stripRoot?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!Array.isArray(body.files) || body.files.length < 1 || body.files.length > IMPORT_BATCH) return jsonError("import_invalid", 400);
  const stripRoot = body.stripRoot === true;
  const notes: PreparedNote[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const file of body.files) {
    const path = typeof file?.path === "string" ? file.path : "";
    const prepared = prepareNote({ title: titleFromPath(path), folder: folderFromPath(path, stripRoot), body: file?.body });
    if ("error" in prepared) {
      skipped.push({ path, reason: prepared.error });
      continue;
    }
    const key = prepared.title.toLowerCase();
    if (seen.has(key)) {
      skipped.push({ path, reason: "duplicate_title" });
      continue;
    }
    seen.add(key);
    notes.push(prepared);
  }
  if (notes.length === 0) return NextResponse.json({ result: { created: 0, updated: 0, skipped } });
  const imported = await readFinanceRpc("import_notes", { actor_id: profile.userId, notes });
  if ("error" in imported) return mapRpcError(imported.error) ?? jsonError("unavailable", 500);
  return NextResponse.json({ result: { ...(imported.data as { created: number; updated: number }), skipped } });
}
