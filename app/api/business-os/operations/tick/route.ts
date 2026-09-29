import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { sendTelegramReminder } from "@/lib/business-os/operations/delivery";
import { operationsStore } from "@/lib/business-os/operations/store";
import { runOperationsTick } from "@/lib/business-os/operations/tick";
import { jobAuthorized } from "@/lib/business-os/sync/store";

export const dynamic = "force-dynamic";

async function tick(request: NextRequest) {
  const secret = process.env.BUSINESS_OS_JOB_SECRET?.trim() || null;
  if (!secret) return jsonError("business_os_unconfigured", 503);
  if (!jobAuthorized(request.headers.get("authorization"), secret)) return jsonError("unauthenticated", 401);
  const token = process.env.BUSINESS_OS_TELEGRAM_BOT_TOKEN?.trim() || "";
  try {
    const result = await runOperationsTick(operationsStore(), {
      now: new Date(),
      transportReady: Boolean(token && process.env.BUSINESS_OS_TELEGRAM_BOT_ID?.trim()),
      send: async (claim) => sendTelegramReminder(token, claim.chatId, claim.text),
    });
    return NextResponse.json(result);
  } catch {
    return jsonError("unavailable", 500);
  }
}

export function GET(request: NextRequest) {
  return tick(request);
}

export function POST(request: NextRequest) {
  return tick(request);
}
