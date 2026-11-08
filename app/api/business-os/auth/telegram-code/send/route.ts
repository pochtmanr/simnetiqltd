import { NextRequest, NextResponse } from "next/server";
import { TELEGRAM_CODE_COOKIE, telegramCodeCookiePolicy } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { generateCode, sendTelegramCode, signCodeTicket, stepUpKey } from "@/lib/business-os/auth/telegram-code";
import { userDb } from "@/lib/business-os/brain/read";
import { requireBusinessOsConfig } from "@/lib/business-os/env";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "telegram_code_send");
  if (blocked) return blocked;

  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const { userId, sessionId } = identity.profile;
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken || !config.telegramBotId) return jsonError("telegram_unconfigured", 503);

    // The recipients come only from this member's linked identities, never from the request.
    // Read as the signed-in user: the schema grants service_role no table access, only functions.
    const db = await userDb();
    if (!db) return jsonError("unauthenticated", 401);
    const linked = await db
      .from("telegram_identities")
      .select("telegram_user_id")
      .eq("user_id", userId)
      .eq("bot_id", config.telegramBotId)
      .is("revoked_at", null);
    if (linked.error) return jsonError("unavailable", 500);
    const chatIds = (linked.data ?? []).map((row) => String(row.telegram_user_id));
    if (chatIds.length === 0) return jsonError("telegram_not_linked", 409);

    const code = generateCode();
    const sent = await Promise.all(
      chatIds.map((chatId) => sendTelegramCode({ botToken: config.telegramBotToken as string, chatId, code })),
    );
    if (!sent.some(Boolean)) return jsonError("telegram_send_failed", 502);

    const ticket = signCodeTicket(code, { userId, sessionId, nowMs: Date.now(), key: stepUpKey(config.telegramBotToken) });
    const response = NextResponse.json({ status: "sent" });
    response.cookies.set(TELEGRAM_CODE_COOKIE, ticket, telegramCodeCookiePolicy(isSecureRequest(request)));
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
