import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { moneyField, optionalDate } from "@/lib/business-os/finance/body";
import { MoneyError } from "@/lib/business-os/finance/money";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.currency !== "string" || typeof body.dayOfMonth !== "number") return jsonError("invalid_body", 400);
  try {
    return operationsRpc("create_recurring_schedule", {
      actor_id: profile.userId,
      payload: {
        vendor: typeof body.vendor === "string" ? body.vendor : null,
        amount: moneyField(body.amount, { currency: body.currency }),
        currency: body.currency,
        day_of_month: body.dayOfMonth,
        month_of_year: typeof body.monthOfYear === "number" ? body.monthOfYear : null,
        starts_on: optionalDate(body.startsOn),
        project_slug: typeof body.projectSlug === "string" ? body.projectSlug : null,
      },
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    throw error;
  }
}
