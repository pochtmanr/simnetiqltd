import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isSecureRequest } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { exchangeCode } from "@/lib/business-os/providers/revolut";
import { REVOLUT_STATE_COOKIE, REVOLUT_STATE_PATH, revolutReady, syncRevolut } from "@/lib/business-os/providers/revolut-connect";
import { seal } from "@/lib/business-os/providers/seal";

export const dynamic = "force-dynamic";

function sameState(cookie: string | undefined, param: string | null): boolean {
  if (!cookie || !param) return false;
  const left = Buffer.from(cookie);
  const right = Buffer.from(param);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Revolut redirects here after consent. The state must match the cookie set when
 * the owner clicked Connect, and the signed-in user must still be the owner.
 * The refresh token is sealed before it is stored, then the first pull runs.
 */
export async function GET(request: NextRequest) {
  const back = (status: string) => {
    const url = new URL("/admin", request.url);
    url.searchParams.set("section", "bank");
    url.searchParams.set("revolut", status);
    const response = NextResponse.redirect(url, 303);
    response.cookies.set(REVOLUT_STATE_COOKIE, "", { path: REVOLUT_STATE_PATH, maxAge: 0, secure: isSecureRequest(request), httpOnly: true, sameSite: "lax" });
    return response;
  };
  const params = request.nextUrl.searchParams;
  if (!sameState(request.cookies.get(REVOLUT_STATE_COOKIE)?.value, params.get("state"))) return back("state_mismatch");
  const code = params.get("code");
  if (!code) return back(params.get("error") ? "declined" : "code_missing");

  const identity = await loadIdentity().catch(() => null);
  if (!identity || identity.kind !== "ready" || identity.profile.role !== "owner") return back("owner_required");
  const ready = revolutReady();
  if ("missing" in ready) return back(ready.missing);

  let refreshToken: string;
  try {
    refreshToken = (await exchangeCode(ready.config, code)).refreshToken;
  } catch {
    return back("exchange_failed");
  }
  const saved = await readFinanceRpc("save_provider_token", {
    actor_id: identity.profile.userId,
    target_provider: "revolut",
    sealed_token: seal(refreshToken, "revolut", ready.key),
  });
  if ("error" in saved) return back("save_failed");
  const first = await syncRevolut().catch(() => ({ outcome: "unavailable" }));
  return back(first.outcome === "committed" ? "connected" : `connected_${first.outcome}`);
}
