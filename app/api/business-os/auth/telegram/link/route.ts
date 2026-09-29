import { NextRequest, NextResponse } from "next/server";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { linkTelegramIdentity } from "@/lib/business-os/auth/telegram-exchange";
import { createSecretClient } from "@/lib/business-os/db/client";
import { requireBusinessOsConfig } from "@/lib/business-os/env";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "telegram_link");
  if (blocked) return blocked;
  let body: { initData?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.initData !== "string" || !body.initData) return jsonError("invalid_body", 400);

  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken || !config.telegramBotId) return jsonError("telegram_unconfigured", 503);
    const admin = createSecretClient(config);
    const result = await linkTelegramIdentity({
      actor: identity.profile,
      rawInitData: body.initData,
      botToken: config.telegramBotToken,
      botId: config.telegramBotId,
      nowMs: Date.now(),
      createChallenge: async (input) => {
        const created = await admin.schema("business_os").rpc("create_link_challenge", {
          actor_id: input.actorId,
          token_hash: input.tokenHash,
          bound_session_id: input.boundSessionId,
          expires_at: input.expiresAt,
        });
        const failure = mapRpcError(created.error);
        if (failure) throw failure;
        if (typeof created.data !== "string") throw new Error("challenge_failed");
        return created.data;
      },
      consumeChallenge: async (input) => {
        const consumed = await admin.schema("business_os").rpc("consume_link_challenge", {
          actor_id: input.actorId,
          challenge_id: input.challengeId,
          token_hash: input.tokenHash,
          bound_session_id: input.boundSessionId,
          bot_id: input.botId,
          telegram_user_id: input.telegramUserId,
          telegram_username: input.telegramUsername,
        });
        const failure = mapRpcError(consumed.error);
        if (failure) throw failure;
      },
    });
    if (result.status === "linked") return NextResponse.json({ status: "linked" });
    const status = result.status === "invalid_init_data" ? 400 : 403;
    return jsonError(result.status, status);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return mapAuthError(error);
  }
}
