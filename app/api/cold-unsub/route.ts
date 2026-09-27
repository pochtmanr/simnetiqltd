import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function suppressByToken(
  token: string,
  reason: string
): Promise<{ ok: true } | { ok: false; status: number }> {
  if (!UUID_RX.test(token)) {
    // Treat invalid tokens as success — never leak which tokens are real.
    return { ok: true };
  }
  const supabase = getServiceSupabase();

  const lookup = await supabase
    .from("outreach_prospects")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (lookup.error) {
    console.error("cold-unsub: lookup failed", lookup.error);
    return { ok: false, status: 500 };
  }
  if (!lookup.data) return { ok: true };
  if (lookup.data.status === "opted_out") return { ok: true };

  const { error: updateErr } = await supabase
    .from("outreach_prospects")
    .update({
      status: "opted_out",
      opted_out_at: new Date().toISOString(),
      unsubscribe_reason: reason,
    })
    .eq("id", lookup.data.id);

  if (updateErr) {
    console.error("cold-unsub: update failed", updateErr);
    return { ok: false, status: 500 };
  }
  return { ok: true };
}

// GET: visible footer link in cold emails.
// We deliberately DO NOT auto-suppress on GET because:
//   1. Gmail/Outlook bot prefetch would silently unsubscribe people who
//      never clicked.
//   2. We want the chance to ask why before confirming.
// Instead we redirect to the confirmation page, which then POSTs the
// token + optional reason once the user clicks.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t")?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/en/unsubscribe?status=invalid`);
  }
  return NextResponse.redirect(
    `${SITE_URL}/en/unsubscribe?cold_token=${encodeURIComponent(token)}`
  );
}

// POST — two clients use this:
//   (a) Gmail/Yahoo's one-click bots, per RFC 8058 List-Unsubscribe-Post.
//       Body is form-encoded `List-Unsubscribe=One-Click`. Token in query.
//   (b) The confirmation page on /en/unsubscribe, JSON body
//       { token, reason? }.
// Both branches result in immediate suppression — the GET-vs-POST split
// is what protects against bot prefetch on the GET path.
async function unsubscribe(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("t")?.trim() ?? "";

  const contentType = request.headers.get("content-type") ?? "";
  let bodyToken: string | null = null;
  let reason: string | null = null;

  if (contentType.includes("application/json")) {
    try {
      const body: { token?: unknown; reason?: unknown } = await request.json();
      if (typeof body.token === "string") bodyToken = body.token.trim();
      if (typeof body.reason === "string")
        reason = body.reason.trim().slice(0, 500) || null;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }
  }

  const token = bodyToken || queryToken;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const result = await suppressByToken(
    token,
    reason ?? (queryToken ? "one-click-post" : "form")
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: "Could not unsubscribe." },
      { status: result.status }
    );
  }
  // Spec says any 2xx is success; body is ignored by RFC 8058 mail clients.
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    return await unsubscribe(request);
  } catch {
    console.error("unsubscribe: subscription service unavailable");
    return NextResponse.json({ error: "Could not unsubscribe. Please try again later." }, { status: 503 });
  }
}
