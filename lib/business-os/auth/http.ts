import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { BusinessOsError } from "@/lib/business-os/auth/authorize";
import { CSRF_COOKIE } from "@/lib/business-os/auth/cookies";
import { assertCsrf } from "@/lib/business-os/auth/csrf";
import { consumeRateLimit, RATE_LIMITS, RATE_WINDOW_MS, type RateBucket } from "@/lib/business-os/auth/rate-limit";
import { financeRpcStatus } from "@/lib/business-os/finance/rpc-status";
import { operationsRpcStatus } from "@/lib/business-os/operations/rpc-status";
import { BusinessOsUnconfiguredError } from "@/lib/business-os/env";

export function jsonError(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

export function isSecureRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

export function clientIp(request: NextRequest): string {
  const first = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || "unknown";
}

export function gateWrite(request: NextRequest, bucket: RateBucket): NextResponse | null {
  try {
    assertCsrf(request.headers, request.cookies.get(CSRF_COOKIE)?.value);
  } catch {
    return jsonError("csrf", 403);
  }
  if (!consumeRateLimit(`${bucket}:${clientIp(request)}`, RATE_LIMITS[bucket], RATE_WINDOW_MS)) {
    return jsonError("rate_limited", 429);
  }
  return null;
}

export function mapAuthError(error: unknown): NextResponse {
  if (error instanceof BusinessOsUnconfiguredError) return jsonError(error.code, 503);
  if (error instanceof BusinessOsError) return jsonError(error.code, error.status);
  return jsonError("unavailable", 500);
}

export function mapRpcError(error: { message?: string } | null): NextResponse | null {
  if (!error) return null;
  const message = error.message ?? "";
  const financeStatus = financeRpcStatus(message);
  if (financeStatus) {
    if (financeStatus === 403) return jsonError("forbidden", 403);
    if (financeStatus === 409) return jsonError("conflict", 409);
    return jsonError("invalid_body", 400);
  }
  const operationsStatus = operationsRpcStatus(message);
  if (operationsStatus === 403) return jsonError("forbidden", 403);
  if (operationsStatus === 400) return jsonError("invalid_body", 400);
  if (message.includes("lease_lost")) return jsonError("conflict", 409);
  if (message.includes("owner_required") || message.includes("membership_missing")) return jsonError("forbidden", 403);
  if (message.includes("replayed_init_data")) return jsonError("replayed_init_data", 403);
  if (message.includes("membership_inactive")) return jsonError("membership_revoked", 403);
  if (message.includes("challenge_invalid")) return jsonError("challenge_invalid", 403);
  if (message.includes("last_owner") || message.includes("owner_exists")) return jsonError("conflict", 409);
  if (
    message.includes("secret_reference_invalid") ||
    message.includes("environment_invalid") ||
    message.includes("provider_invalid") ||
    message.includes("base_url_invalid") ||
    message.includes("key_invalid") ||
    message.includes("page_limit_invalid") ||
    message.includes("dataset_invalid") ||
    message.includes("contract_mismatch") ||
    message.includes("project_mismatch") ||
    message.includes("worker_invalid") ||
    message.includes("lease_invalid") ||
    message.includes("connection_missing") ||
    message.includes("reason_required") ||
    message.includes("challenge_expiry")
  ) {
    return jsonError("invalid_body", 400);
  }
  return jsonError("unavailable", 500);
}
