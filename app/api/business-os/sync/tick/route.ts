import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { jobAuthorized, readSourceSecret, secretStore } from "@/lib/business-os/sync/store";
import { runSyncTick } from "@/lib/business-os/sync/worker";

export const dynamic = "force-dynamic";

async function tick(request: NextRequest) {
  const secret = process.env.BUSINESS_OS_JOB_SECRET?.trim() || null;
  if (!secret) return jsonError("business_os_unconfigured", 503);
  if (!jobAuthorized(request.headers.get("authorization"), secret)) return jsonError("unauthenticated", 401);
  try {
    const workerId = `cronw-${randomBytes(4).toString("hex")}`;
    const result = await runSyncTick(secretStore(), { workerId, secretFor: readSourceSecret });
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
