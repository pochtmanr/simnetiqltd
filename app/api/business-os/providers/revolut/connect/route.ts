import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSecureRequest, jsonError } from "@/lib/business-os/auth/http";
import { beginOperationsOwner } from "@/lib/business-os/operations/route-guard";
import { consentUrl } from "@/lib/business-os/providers/revolut";
import { REVOLUT_STATE_COOKIE, REVOLUT_STATE_PATH, revolutReady } from "@/lib/business-os/providers/revolut-connect";

/** Owner with step-up starts the consent: returns Revolut's consent URL and remembers the state for the callback. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsOwner(request);
  if (profile instanceof NextResponse) return profile;
  const ready = revolutReady();
  if ("missing" in ready) return jsonError(ready.missing, 503);
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.json({ result: { url: consentUrl(ready.config, state) } });
  response.cookies.set(REVOLUT_STATE_COOKIE, state, {
    httpOnly: true,
    // Lax, so the cookie rides along on Revolut's top-level redirect back.
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: REVOLUT_STATE_PATH,
    maxAge: 600,
  });
  return response;
}
