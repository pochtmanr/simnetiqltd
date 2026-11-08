import { NextRequest, NextResponse } from "next/server";
import {
  STEP_UP_COOKIE,
  stepUpCookiePolicy,
  TELEGRAM_CODE_COOKIE,
  telegramCodeCookiePolicy,
} from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { consumeRateLimit, RATE_LIMITS, RATE_WINDOW_MS } from "@/lib/business-os/auth/rate-limit";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { signStepUp, STEP_UP_TTL_MS, stepUpKey, verifyCodeTicket } from "@/lib/business-os/auth/telegram-code";
import { requireBusinessOsConfig } from "@/lib/business-os/env";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "telegram_code_verify");
  if (blocked) return blocked;
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.code !== "string") return jsonError("invalid_body", 400);

  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const { userId, sessionId } = identity.profile;
    // Also count guesses per member, so changing IP does not reset the budget.
    if (!consumeRateLimit(`telegram_code_verify:user:${userId}`, RATE_LIMITS.telegram_code_verify, RATE_WINDOW_MS)) {
      return jsonError("rate_limited", 429);
    }
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken) return jsonError("telegram_unconfigured", 503);

    const binding = { userId, sessionId, nowMs: Date.now(), key: stepUpKey(config.telegramBotToken) };
    const verdict = verifyCodeTicket(request.cookies.get(TELEGRAM_CODE_COOKIE)?.value, body.code.trim(), binding);
    if (verdict !== "ok") return jsonError(verdict, verdict === "code_expired" ? 410 : 400);

    const secure = isSecureRequest(request);
    const stepUp = signStepUp(binding);
    const response = NextResponse.json({ status: "confirmed", until: new Date(stepUp.expiresAt).toISOString() });
    response.cookies.set(STEP_UP_COOKIE, stepUp.value, stepUpCookiePolicy(secure, STEP_UP_TTL_MS / 1000));
    response.cookies.set(TELEGRAM_CODE_COOKIE, "", { ...telegramCodeCookiePolicy(secure), maxAge: 0 });
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
