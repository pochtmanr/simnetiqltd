import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { userDb } from "@/lib/business-os/brain/read";
import { beginOperationsRead } from "@/lib/business-os/operations/route-guard";

const PAGE = 200;
/** Stay well under Vercel's 4.5 MB response cap. */
const MAX_PAGE_BYTES = 3_000_000;

/** One page of notes for a vault export. Pages keep each response under the 4.5 MB limit. */
export async function GET(request: NextRequest) {
  const profile = await beginOperationsRead();
  if (profile instanceof NextResponse) return profile;
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  if (!Number.isInteger(offset) || offset < 0) return jsonError("invalid_body", 400);
  const db = await userDb();
  if (!db) return jsonError("unauthenticated", 401);
  const result = await db.from("notes").select("title, folder, body_md").order("created_at", { ascending: true }).order("id").range(offset, offset + PAGE - 1);
  if (result.error) return jsonError("unavailable", 500);
  const rows = result.data ?? [];
  const notes: { title: string; folder: string; body: string }[] = [];
  let bytes = 0;
  for (const row of rows) {
    const note = { title: row.title as string, folder: row.folder as string, body: row.body_md as string };
    const size = note.body.length * 3 + note.title.length + note.folder.length;
    if (notes.length > 0 && bytes + size > MAX_PAGE_BYTES) break;
    notes.push(note);
    bytes += size;
  }
  const more = notes.length < rows.length || rows.length === PAGE;
  return NextResponse.json({ result: { notes, next: more ? offset + notes.length : null } });
}
