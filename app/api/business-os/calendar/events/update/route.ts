import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { parseCalendarUpdate } from "@/lib/business-os/calendar/body";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const parsed = parseCalendarUpdate(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  return operationsRpc("update_calendar_event", { actor_id: profile.userId, payload: parsed.payload });
}
