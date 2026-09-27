import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isLocale } from "@/lib/i18n";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detectLocale(req: NextRequest, body?: { locale?: unknown }): string {
  if (body && typeof body.locale === "string" && isLocale(body.locale)) {
    return body.locale;
  }
  const referer = req.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    const seg = path.split("/").filter(Boolean)[0];
    if (seg && isLocale(seg)) return seg;
  } catch {
    /* ignore */
  }
  return "en";
}

async function markUnsubscribed(opts: {
  by: "token" | "email";
  value: string;
  reason: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; reason: string }> {
  const supabase = getServiceSupabase();

  const lookup = await (opts.by === "token"
    ? supabase
        .from("marketing_contacts")
        .select("id, status")
        .eq("unsubscribe_token", opts.value)
        .maybeSingle()
    : supabase
        .from("marketing_contacts")
        .select("id, status")
        .eq("email", opts.value)
        .maybeSingle());

  if (lookup.error) {
    console.error("unsubscribe: lookup failed", lookup.error);
    return { ok: false, status: 500, reason: "lookup_failed" };
  }

  // Idempotent — pretend success even if no row found, so we don't
  // leak which addresses are on the list.
  if (!lookup.data) return { ok: true };
  if (lookup.data.status === "unsubscribed") return { ok: true };

  const { error: updateErr } = await supabase
    .from("marketing_contacts")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: opts.reason,
    })
    .eq("id", lookup.data.id);

  if (updateErr) {
    console.error("unsubscribe: update failed", updateErr);
    return { ok: false, status: 500, reason: "update_failed" };
  }
  return { ok: true };
}

// GET visible-footer-link path. We deliberately do NOT suppress on GET
// because Gmail/Outlook bot prefetch would silently unsubscribe people
// who never clicked. Always redirect to the confirmation page; the user
// then POSTs from there with an optional reason. Real RFC 8058 one-click
// clients hit POST, not GET, so this doesn't break header-driven unsub.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const locale = detectLocale(request);

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/${locale}/unsubscribe`);
  }
  return NextResponse.redirect(
    `${SITE_URL}/${locale}/unsubscribe?token=${encodeURIComponent(token)}`
  );
}

// Form/JSON unsubscribe: POST /api/unsubscribe with { email, reason?, locale? }
async function unsubscribe(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Support both JSON and List-Unsubscribe-Post form-style POSTs.
  const contentType = request.headers.get("content-type") ?? "";
  let email: string | null = null;
  let reason: string | null = null;
  let token: string | null = new URL(request.url).searchParams.get("token")?.trim() ?? null;

  if (contentType.includes("application/json")) {
    let body: { email?: unknown; reason?: unknown; token?: unknown; locale?: unknown };
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
      body = parsed;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }
    if (typeof body.email === "string") email = body.email.trim().toLowerCase();
    if (typeof body.reason === "string")
      reason = body.reason.trim().slice(0, 500) || null;
    if (typeof body.token === "string") token = body.token.trim();
  } else {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const e = form.get("email");
    const r = form.get("reason");
    const t = form.get("token");
    if (typeof e === "string") email = e.trim().toLowerCase();
    if (typeof r === "string") reason = r.trim().slice(0, 500) || null;
    if (typeof t === "string") token = t.trim();
  }

  if (token) {
    const result = await markUnsubscribed({
      by: "token",
      value: token,
      reason: reason ?? "one-click",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Could not unsubscribe." },
        { status: result.status }
      );
    }
    return NextResponse.json({ success: true });
  }

  if (!email || !EMAIL_RX.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const result = await markUnsubscribed({
    by: "email",
    value: email,
    reason: reason ?? "form",
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: "Could not unsubscribe." },
      { status: result.status }
    );
  }
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    return await unsubscribe(request);
  } catch {
    console.error("unsubscribe: subscription service unavailable");
    return NextResponse.json({ error: "Could not unsubscribe. Please try again later." }, { status: 503 });
  }
}
