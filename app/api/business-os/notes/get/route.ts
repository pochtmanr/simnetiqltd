import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { userDb } from "@/lib/business-os/brain/read";
import { isUuid } from "@/lib/business-os/finance/body";
import { beginOperationsRead } from "@/lib/business-os/operations/route-guard";

/** One note with its body. Bodies are fetched on open so the page payload stays small for big vaults. */
export async function GET(request: NextRequest) {
  const profile = await beginOperationsRead();
  if (profile instanceof NextResponse) return profile;
  const id = request.nextUrl.searchParams.get("id");
  if (!isUuid(id)) return jsonError("invalid_body", 400);
  const db = await userDb();
  if (!db) return jsonError("unauthenticated", 401);
  const result = await db.from("notes").select("id, title, folder, body_md, tags, document_id, updated_at").eq("id", id).maybeSingle();
  if (result.error) return jsonError("unavailable", 500);
  if (!result.data) return jsonError("note_missing", 404);
  const row = result.data;
  return NextResponse.json({
    result: { id: row.id, title: row.title, folder: row.folder, body: row.body_md, tags: row.tags, documentId: row.document_id, updatedAt: row.updated_at },
  });
}
