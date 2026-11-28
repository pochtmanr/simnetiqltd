import { NextRequest, NextResponse } from "next/server";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { findLinkedMember } from "@/lib/business-os/auth/session";
import { validateInitData } from "@/lib/business-os/auth/telegram-init-data";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";

/**
 * Called from the approve page inside Telegram. There is no browser session here:
 * the proof is Telegram's signed init data from an account linked to the member.
 */
export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "step_up_approve");
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { initData?: unknown; requestId?: unknown; approve?: unknown };
  if (typeof body.initData !== "string" || !body.initData || !isUuid(body.requestId) || typeof body.approve !== "boolean") {
    return jsonError("invalid_body", 400);
  }

  try {
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken || !config.telegramBotId) return jsonError("telegram_unconfigured", 503);
    const validated = validateInitData(body.initData, config.telegramBotToken, Date.now());
    if (!validated.ok) return jsonError("invalid_init_data", 400);
    const member = await findLinkedMember(validated.data.telegramUserId, config.telegramBotId);
    if (!member) return jsonError("forbidden", 403);

    const decided = await readFinanceRpc("decide_step_up_request", {
      actor_id: member.userId,
      request_id: body.requestId,
      bot_id: config.telegramBotId,
      telegram_user_id: validated.data.telegramUserId,
      approve: body.approve,
    });
    if ("error" in decided) return mapRpcError(decided.error) ?? jsonError("unavailable", 500);
    return NextResponse.json({ status: String(decided.data) });
  } catch (error) {
    return mapAuthError(error);
  }
}
