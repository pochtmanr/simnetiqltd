import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsOwner } from "@/lib/business-os/operations/route-guard";

const LEADS = new Set([1, 3, 7, 14, 30]);

export async function POST(request: NextRequest) {
  const profile = await beginOperationsOwner(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (body.kind === "recipient") {
    if (typeof body.telegramUserId !== "string" || !/^[1-9][0-9]{0,18}$/.test(body.telegramUserId)) {
      return jsonError("invalid_body", 400);
    }
    return operationsRpc("set_reminder_recipient", {
      actor_id: profile.userId,
      telegram_user_id: body.telegramUserId,
      enabled: body.enabled !== false,
    });
  }
  if (!Array.isArray(body.leadDays) || body.leadDays.some((day) => typeof day !== "number" || !LEADS.has(day))) {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.quietStart !== "string" || typeof body.quietEnd !== "string") return jsonError("invalid_body", 400);
  return operationsRpc("save_reminder_preferences", {
    actor_id: profile.userId,
    payload: {
      consent: body.consent === true,
      quiet_start: body.quietStart,
      quiet_end: body.quietEnd,
      lead_days: body.leadDays,
    },
  });
}
