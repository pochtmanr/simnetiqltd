import { NextRequest, NextResponse } from "next/server";
import { DEVICE_COOKIE, STEP_UP_COOKIE, stepUpCookiePolicy } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { deviceHash, signStepUp, STEP_UP_TTL_MS, stepUpKey } from "@/lib/business-os/auth/telegram-code";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";

/** Polled by the waiting dialog. Once Telegram approved, the browser that asked gets the trusted-browser cookie, once. */
export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "step_up_status");
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { requestId?: unknown };
  if (!isUuid(body.requestId)) return jsonError("invalid_body", 400);

  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const config = requireBusinessOsConfig();
    if (!config.telegramBotToken) return jsonError("telegram_unconfigured", 503);
    const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
    if (!deviceId) return NextResponse.json({ status: "expired" });

    const claimed = await readFinanceRpc("claim_step_up_request", {
      actor_id: identity.profile.userId,
      request_id: body.requestId,
      device_hash: deviceHash(deviceId),
    });
    if ("error" in claimed) return mapRpcError(claimed.error) ?? jsonError("unavailable", 500);
    const status = String(claimed.data);
    const response = NextResponse.json({ status });
    if (status === "approved") {
      const stepUp = signStepUp({
        userId: identity.profile.userId,
        deviceId,
        nowMs: Date.now(),
        key: stepUpKey(config.telegramBotToken),
      });
      response.cookies.set(STEP_UP_COOKIE, stepUp.value, stepUpCookiePolicy(isSecureRequest(request), STEP_UP_TTL_MS / 1000));
    }
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
