import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sendEmailTo } from "@/lib/smtp";
import { rateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";
import {
  renderConfirmEmail,
  type SubscribeEmailLocale,
} from "@/lib/subscribe-email";
import { isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeBody = {
  email?: unknown;
  consent?: unknown;
  name?: unknown;
  country?: unknown;
  company?: unknown;
  locale?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  // honeypot — bots fill it
  website?: unknown;
};

function detectLocale(
  req: NextRequest,
  raw: unknown
): SubscribeEmailLocale {
  if (typeof raw === "string" && isLocale(raw)) return raw;
  const referer = req.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    if (path.startsWith("/he")) return "he";
    if (path.startsWith("/ru")) return "ru";
  } catch {
    /* invalid referer */
  }
  return "en";
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

async function subscribe(request: NextRequest) {
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

  let body: SubscribeBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    body = parsed as SubscribeBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot — silently succeed so bots don't learn anything.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  if (!emailRaw || !EMAIL_RX.test(emailRaw) || emailRaw.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Please agree to receive email updates." }, { status: 400 });
  }
  const email = emailRaw.toLowerCase();

  const name = asTrimmedString(body.name, 120);
  const country = asTrimmedString(body.country, 80);
  const company = asTrimmedString(body.company, 120);
  const utmSource = asTrimmedString(body.utm_source, 80);
  const utmMedium = asTrimmedString(body.utm_medium, 80);
  const utmCampaign = asTrimmedString(body.utm_campaign, 120);
  const locale = detectLocale(request, body.locale);

  const supabase = getServiceSupabase();

  // Confirmed addresses receive the same public response as new requests.
  const { data: existing, error: lookupErr } = await supabase
    .from("marketing_contacts")
    .select(
      "id, status, confirmation_token, unsubscribe_token, name, country, company"
    )
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    console.error("subscribe: lookup failed", lookupErr.code);
    return NextResponse.json(
      { error: "Could not process subscription. Please try again." },
      { status: 500 }
    );
  }

  let row: {
    confirmation_token: string;
    unsubscribe_token: string;
    status: string;
    name: string | null;
  };

  if (existing) {
    if (existing.status === "confirmed") {
      // Already on the list — return success without re-sending email.
      return NextResponse.json({ success: true });
    }
    // Every new consent attempt receives a fresh token. An old email must
    // never confirm a later resubscription after the recipient opted out.
    const { data: updated, error: updateErr } = await supabase
      .from("marketing_contacts")
      .update({
        status: "pending",
        confirmation_token: randomUUID(),
        name: name ?? existing.name,
        country: country ?? existing.country,
        company: company ?? existing.company,
        confirmed_at: null,
        unsubscribed_at: null,
        unsubscribe_reason: null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      })
      .eq("id", existing.id)
      .eq("status", existing.status)
      .select("confirmation_token, unsubscribe_token, status, name")
      .maybeSingle();
    if (updateErr) {
      console.error("subscribe: update failed", updateErr.code);
      return NextResponse.json(
        { error: "Could not process subscription. Please try again." },
        { status: 500 }
      );
    }
    if (!updated) return NextResponse.json({ success: true });
    row = updated;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("marketing_contacts")
      .insert({
        email,
        name,
        country,
        company,
        source: "simnetiq-subscribe-page",
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      })
      .select("confirmation_token, unsubscribe_token, status, name")
      .single();
    if (insertErr || !inserted) {
      console.error("subscribe: insert failed", insertErr?.code);
      return NextResponse.json(
        { error: "Could not process subscription. Please try again." },
        { status: 500 }
      );
    }
    row = inserted;
  }

  const confirmUrl = `${SITE_URL}/api/subscribe/confirm?token=${encodeURIComponent(row.confirmation_token)}&locale=${locale}`;
  const unsubscribeUrl = `${SITE_URL}/${locale}/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}`;
  const { subject, text, html } = renderConfirmEmail({
    name: row.name ?? name,
    confirmUrl,
    unsubscribeUrl,
    locale,
  });
  // Report delivery failures so the form can offer a retry. The database
  // remains pending until the recipient follows the confirmation link.
  await sendEmailTo({ to: email, subject, text, html });
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    return await subscribe(request);
  } catch {
    console.error("subscribe: subscription service unavailable");
    return NextResponse.json(
      { error: "Could not send your confirmation email. Please try again later." },
      { status: 503 }
    );
  }
}
