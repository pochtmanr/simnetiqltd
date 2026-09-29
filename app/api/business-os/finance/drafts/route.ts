import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { MoneyError } from "@/lib/business-os/finance/money";
import { isUuid, moneyField, optionalDate } from "@/lib/business-os/finance/body";
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
  try {
    const workflow = body.workflowKind;
    if (workflow !== "expense" && workflow !== "manual_income") return jsonError("invalid_body", 400);
    if (typeof body.currency !== "string") return jsonError("invalid_body", 400);
    const payload: Record<string, unknown> = {
      workflow_kind: workflow,
      vendor: typeof body.vendor === "string" ? body.vendor : null,
      category: typeof body.category === "string" ? body.category : null,
      due_on: optionalDate(body.dueOn),
      paid_on: optionalDate(body.paidOn),
      service_on: optionalDate(body.serviceOn),
      amount: moneyField(body.amount, { currency: body.currency }),
      currency: body.currency,
      tax_amount: body.taxAmount === null || body.taxAmount === undefined ? null : moneyField(body.taxAmount, { currency: body.currency }),
      tax_inclusion: body.taxInclusion ?? null,
      vat_recoverable: body.vatRecoverable ?? null,
      payment_account_code: typeof body.paymentAccountCode === "string" ? body.paymentAccountCode : null,
    };
    if (body.receiptPath !== undefined || body.receiptChecksum !== undefined) {
      if (typeof body.receiptPath !== "string" || typeof body.receiptChecksum !== "string") return jsonError("invalid_body", 400);
      payload.receipt_path = body.receiptPath;
      payload.receipt_checksum = body.receiptChecksum;
    }
    if (body.expenseId !== undefined && !isUuid(body.expenseId)) return jsonError("invalid_body", 400);
    return financeRpc("draft_manual_entry", { actor_id: profile.userId, payload });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    return mapAuthError(error);
  }
}
