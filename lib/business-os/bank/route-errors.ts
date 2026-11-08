import "server-only";
import type { NextResponse } from "next/server";
import { jsonError, mapRpcError } from "@/lib/business-os/auth/http";

const CODES: Record<string, number> = { category_invalid: 400, rule_invalid: 400, transaction_missing: 404, rule_missing: 404 };

export function bankRpcFailure(error: { message?: string }): NextResponse {
  const message = error.message ?? "";
  for (const [code, status] of Object.entries(CODES)) if (message.includes(code)) return jsonError(code, status);
  return mapRpcError(error) ?? jsonError("unavailable", 500);
}
