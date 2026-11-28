import { NextRequest, NextResponse } from "next/server";
import { DEVICE_COOKIE, deviceCookiePolicy, TELEGRAM_CODE_COOKIE, telegramCodeCookiePolicy } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import {
  botUsername,
  deviceHash,
  generateCode,
  newDeviceId,
  sendTelegramCode,
  signCodeTicket,
  stepUpKey,
} from "@/lib/business-os/auth/telegram-code";
import { userDb } from "@/lib/business-os/brain/read";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { SITE_URL } from "@/lib/site";

const DEFAULT_LABEL = "Confirm this change";

/** Opens a confirmation request and sends it to the member's Telegram: Approve button plus a typed-code fallback. */
export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "telegram_code_send");
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { label?: unknown };
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 120) : DEFAULT_LABEL;

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

    const deviceId = request.cookies.get(DEVICE_COOKIE)?.value || newDeviceId();
    const created = await readFinanceRpc("create_step_up_request", {
      actor_id: userId,
      device_hash: deviceHash(deviceId),
      label,
    });
    if ("error" in created) return mapRpcError(created.error) ?? jsonError("unavailable", 500);
    const requestId = String(created.data);

    const code = generateCode();
    const approveUrl = `${SITE_URL}/tg/approve?r=${requestId}`;
    const sent = await Promise.all(
      chatIds.map((chatId) => sendTelegramCode({ botToken: config.telegramBotToken as string, chatId, code, label, approveUrl })),
    );
    if (!sent.some(Boolean)) return jsonError("telegram_send_failed", 502);

    const secure = isSecureRequest(request);
    const ticket = signCodeTicket(code, { userId, sessionId, nowMs: Date.now(), key: stepUpKey(config.telegramBotToken) });
    const username = await botUsername(config.telegramBotToken);
    const response = NextResponse.json({ status: "sent", requestId, telegramUrl: username ? `https://t.me/${username}` : null });
    response.cookies.set(TELEGRAM_CODE_COOKIE, ticket, telegramCodeCookiePolicy(secure));
    response.cookies.set(DEVICE_COOKIE, deviceId, deviceCookiePolicy(secure));
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
