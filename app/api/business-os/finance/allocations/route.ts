import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { MoneyError } from "@/lib/business-os/finance/money";
import { isUuid, moneyField } from "@/lib/business-os/finance/body";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { expenseId?: unknown; currency?: unknown; allocations?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.expenseId) || typeof body.currency !== "string" || !Array.isArray(body.allocations)) {
    return jsonError("invalid_body", 400);
  }
  try {
    const allocations = body.allocations.map((item) => {
      if (!item || typeof item !== "object") throw new MoneyError("allocation_invalid");
      const row = item as { projectSlug?: unknown; amount?: unknown; allocationId?: unknown };
      if (typeof row.projectSlug !== "string") throw new MoneyError("allocation_invalid");
      if (row.allocationId !== undefined && !isUuid(row.allocationId)) throw new MoneyError("allocation_invalid");
      return {
        project_slug: row.projectSlug,
        amount: moneyField(row.amount, { currency: body.currency as string }),
        allocation_id: row.allocationId ?? null,
      };
    });
    return financeRpc("allocate_shared_expense", {
      actor_id: profile.userId,
      target_expense: body.expenseId,
      allocations,
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    return mapAuthError(error);
  }
}
