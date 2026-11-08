import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { CATEGORY_SLUG } from "@/lib/business-os/bank/categories";
import { bankRpcFailure } from "@/lib/business-os/bank/route-errors";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

/**
 * { match, category } saves a rule and applies it to uncategorised and rule-set rows.
 * { delete: id } removes one; rows it categorised keep their category.
 */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  const body = (await request.json().catch(() => null)) as { match?: unknown; category?: unknown; delete?: unknown } | null;
  if (!body) return jsonError("invalid_body", 400);
  if (body.delete !== undefined) {
    if (!isUuid(body.delete)) return jsonError("invalid_body", 400);
    const removed = await readFinanceRpc("delete_bank_rule", { actor_id: profile.userId, rule_id: body.delete });
    if ("error" in removed) return bankRpcFailure(removed.error);
    return NextResponse.json({ result: removed.data });
  }
  if (typeof body.match !== "string" || typeof body.category !== "string" || !CATEGORY_SLUG.test(body.category)) return jsonError("invalid_body", 400);
  const saved = await readFinanceRpc("save_bank_rule", { actor_id: profile.userId, rule_match: body.match, rule_category: body.category });
  if ("error" in saved) return bankRpcFailure(saved.error);
  return NextResponse.json({ result: saved.data });
}
