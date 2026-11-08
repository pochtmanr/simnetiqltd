import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { syncRevolut } from "@/lib/business-os/providers/revolut-connect";
import { jobAuthorized } from "@/lib/business-os/sync/store";

export const dynamic = "force-dynamic";

/**
 * Pulls every direct provider. Each provider runs on its own and records its
 * own run, so one failing never blocks the others.
 */
async function tick(request: NextRequest) {
  const secret = process.env.BUSINESS_OS_JOB_SECRET?.trim() || null;
  if (!secret) return jsonError("business_os_unconfigured", 503);
  if (!jobAuthorized(request.headers.get("authorization"), secret)) return jsonError("unauthenticated", 401);
  const [revolut] = await Promise.allSettled([syncRevolut()]);
  return NextResponse.json({
    revolut: revolut.status === "fulfilled" ? revolut.value : { outcome: "unavailable", rows: 0 },
  });
}

export function GET(request: NextRequest) {
  return tick(request);
}

export function POST(request: NextRequest) {
  return tick(request);
}
