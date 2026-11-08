import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { CATEGORY_SLUG } from "@/lib/business-os/bank/categories";
import { bankRpcFailure } from "@/lib/business-os/bank/route-errors";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

/** Sets a transaction's category by hand (null clears it). A hand-set category is never overwritten by rules or re-pulls. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  const body = (await request.json().catch(() => null)) as { id?: unknown; category?: unknown } | null;
  if (!body || !isUuid(body.id)) return jsonError("invalid_body", 400);
  const category = body.category === null ? null : body.category;
  if (category !== null && (typeof category !== "string" || !CATEGORY_SLUG.test(category))) return jsonError("category_invalid", 400);
  const saved = await readFinanceRpc("set_bank_category", { actor_id: profile.userId, transaction_id: body.id, new_category: category });
  if ("error" in saved) return bankRpcFailure(saved.error);
  return NextResponse.json({ result: saved.data });
}
