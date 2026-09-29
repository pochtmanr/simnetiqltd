import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { isUuid, moneyField, optionalDate } from "@/lib/business-os/finance/body";
import { MoneyError } from "@/lib/business-os/finance/money";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.expenseId)) return jsonError("invalid_body", 400);
  try {
    const payload: Record<string, unknown> = {};
    if (body.amount !== undefined) {
      if (typeof body.currency !== "string") return jsonError("invalid_body", 400);
      payload.amount = moneyField(body.amount, { currency: body.currency });
      payload.currency = body.currency;
    }
    if (typeof body.vendor === "string") payload.vendor = body.vendor;
    if (body.dueOn !== undefined) payload.due_on = optionalDate(body.dueOn);
    if (body.paidOn !== undefined) payload.paid_on = optionalDate(body.paidOn);
    if (body.serviceOn !== undefined) payload.service_on = optionalDate(body.serviceOn);
    return financeRpc("update_manual_draft", {
      actor_id: profile.userId,
      target_expense: body.expenseId,
      payload,
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    return mapAuthError(error);
  }
}
