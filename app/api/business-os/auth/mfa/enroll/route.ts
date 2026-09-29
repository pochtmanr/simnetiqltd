import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/business-os/auth/cookies";
import { gateWrite, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { createPublishableClient } from "@/lib/business-os/db/client";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "mfa");
  if (blocked) return blocked;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access || !refresh) return jsonError("unauthenticated", 401);
  try {
    const client = createPublishableClient();
    const established = await client.auth.setSession({ access_token: access, refresh_token: refresh });
    if (established.error) return jsonError("unauthenticated", 401);
    const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Business OS" });
    if (enrolled.error || enrolled.data.type !== "totp") return jsonError("mfa_failed", 400);
    return NextResponse.json({
      factorId: enrolled.data.id,
      qrCode: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    });
  } catch (error) {
    return mapAuthError(error);
  }
}
