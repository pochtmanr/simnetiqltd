import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapRpcError } from "@/lib/business-os/auth/http";
import { prepareNote } from "@/lib/business-os/brain/prepare";
import { selectAll, userDb } from "@/lib/business-os/brain/read";
import { noteKey, renameLinks } from "@/lib/business-os/brain/wikilinks";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

function rpcFailure(error: { message?: string }): NextResponse {
  const message = error.message ?? "";
  for (const code of ["note_title_taken", "title_invalid", "folder_invalid", "note_too_large", "tag_invalid", "note_missing"]) {
    if (message.includes(code)) return jsonError(code, code === "note_title_taken" ? 409 : code === "note_missing" ? 404 : 400);
  }
  return mapRpcError(error) ?? jsonError("unavailable", 500);
}

/**
 * Create or update a note. Renaming a note rewrites [[links]] to it in every
 * other note, as Obsidian does, so backlinks survive the rename.
 */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request, "files");
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const id = body.id === undefined || body.id === null ? null : body.id;
  if (id !== null && !isUuid(id)) return jsonError("invalid_body", 400);
  if (body.documentId !== undefined && body.documentId !== null && !isUuid(body.documentId)) return jsonError("invalid_body", 400);
  const note = prepareNote({ title: body.title, folder: body.folder, body: body.body });
  if ("error" in note) return jsonError(note.error, 400);

  const db = await userDb();
  if (!db) return jsonError("unauthenticated", 401);
  let previousTitle: string | null = null;
  if (id) {
    const current = await db.from("notes").select("title").eq("id", id).maybeSingle();
    if (current.error) return jsonError("unavailable", 500);
    if (!current.data) return jsonError("note_missing", 404);
    previousTitle = current.data.title as string;
  }

  const payload: Record<string, unknown> = { ...note, ...(id ? { id } : {}) };
  if (body.documentId !== undefined) payload.document_id = body.documentId;
  const saved = await readFinanceRpc("save_note", { actor_id: profile.userId, payload });
  if ("error" in saved) return rpcFailure(saved.error);
  const result = saved.data as { id: string; title: string; updatedAt: string };

  // Rewrite links in other notes when the title changed in more than letter case.
  let relinked = 0;
  if (previousTitle && noteKey(previousTitle) !== noteKey(note.title)) {
    const fromKey = noteKey(previousTitle);
    const linking = await selectAll<{ from_note: string }>((from, to) => db.from("note_links").select("from_note").eq("to_key", fromKey).range(from, to), 5000);
    const ids = [...new Set((linking ?? []).map((row) => row.from_note))].filter((noteId) => noteId !== result.id);
    for (const noteId of ids) {
      const other = await db.from("notes").select("id, title, folder, body_md").eq("id", noteId).maybeSingle();
      if (!other.data) continue;
      const rewritten = renameLinks(other.data.body_md as string, previousTitle, note.title);
      if (rewritten === other.data.body_md) continue;
      const prepared = prepareNote({ title: other.data.title, folder: other.data.folder, body: rewritten });
      if ("error" in prepared) continue;
      const updated = await readFinanceRpc("save_note", { actor_id: profile.userId, payload: { ...prepared, id: noteId } });
      if (!("error" in updated)) relinked += 1;
    }
  }
  return NextResponse.json({ result: { ...result, tags: note.tags, links: note.links, relinked } });
}
