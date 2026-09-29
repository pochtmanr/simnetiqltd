import { NextRequest, NextResponse } from "next/server";
import { applySessionCookies, SESSION_COOKIE, sessionCookiePolicy } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { findLinkedMember, mintBrokerSession } from "@/lib/business-os/auth/session";
import { exchangeTelegramSession } from "@/lib/business-os/auth/telegram-exchange";
import { createSecretClient } from "@/lib/business-os/db/client";
import { requireBusinessOsConfig } from "@/lib/business-os/env";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "telegram_exchange");
  if (blocked) return blocked;
  let body: { initData?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.initData !== "string" || !body.initData) return jsonError("invalid_body", 400);

  try {
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken || !config.telegramBotId) return jsonError("telegram_unconfigured", 503);
    const admin = createSecretClient(config);
    const result = await exchangeTelegramSession({
      rawInitData: body.initData,
      botToken: config.telegramBotToken,
      nowMs: Date.now(),
      sessionId: request.cookies.get(SESSION_COOKIE)?.value ?? null,
      brokerEnabled: config.brokerEnabled,
      findMember: async (telegramUserId) => findLinkedMember(telegramUserId, config.telegramBotId as string),
      consume: async (input) => {
        const consumed = await admin.schema("business_os").rpc("consume_init_data", {
          actor_id: input.userId,
          init_data_hash: input.initDataHash,
          session_id: input.sessionId,
        });
        if (!consumed.error) return "consumed";
        const message = consumed.error.message ?? "";
        if (message.includes("replayed_init_data")) return "replayed";
        if (message.includes("membership_inactive")) return "inactive";
        const failure = mapRpcError(consumed.error);
        throw failure ?? consumed.error;
      },
      mint: (email, expectedUserId) => mintBrokerSession(email, expectedUserId),
    });

    if (result.status === "session") {
      const response = NextResponse.json({ status: "authenticated", userId: result.userId });
      applySessionCookies(
        response,
        { accessToken: result.accessToken, refreshToken: result.refreshToken, sessionId: result.sessionId },
        isSecureRequest(request),
      );
      return response;
    }
    if (result.status === "identity_mismatch") {
      const response = jsonError("identity_mismatch", 403);
      response.cookies.set(SESSION_COOKIE, result.sessionId, sessionCookiePolicy(isSecureRequest(request)));
      return response;
    }
    if (result.status === "broker_unavailable") return jsonError("telegram_broker_unavailable", 501);
    if (result.status === "invalid_init_data") return jsonError("invalid_init_data", 400);
    return jsonError(result.status, 403);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return mapAuthError(error);
  }
}
