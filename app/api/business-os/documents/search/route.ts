import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsRead } from "@/lib/business-os/operations/route-guard";

/** Full-text search over titles, folders, vendors, summaries and extracted text. */
export async function GET(request: NextRequest) {
  const profile = await beginOperationsRead();
  if (profile instanceof NextResponse) return profile;
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1 || q.length > 200) return jsonError("query_invalid", 400);
  return operationsRpc("search_documents", { actor_id: profile.userId, search_text: q, max_rows: 50 });
}
