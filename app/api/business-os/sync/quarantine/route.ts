import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { createUserClient } from "@/lib/business-os/db/client";

export async function GET() {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const { cookies } = await import("next/headers");
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!access) return jsonError("unauthenticated", 401);
    const rows = await createUserClient(access)
      .schema("business_os")
      .from("import_quarantine")
      .select("id, connection_id, endpoint, reason, record_id, revision, content_hash, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (rows.error) return jsonError("unavailable", 500);
    return NextResponse.json({ quarantine: rows.data ?? [] });
  } catch (error) {
    return mapAuthError(error);
  }
}
