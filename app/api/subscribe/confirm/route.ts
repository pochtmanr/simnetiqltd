import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

function detectLocale(req: NextRequest): string {
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

async function confirm(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const localeParam = url.searchParams.get("locale")?.trim();
  const locale =
    localeParam && isLocale(localeParam) ? localeParam : detectLocale(request);

  if (!token) {
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=invalid`
    );
  }

  const supabase = getServiceSupabase();
  const { data: row, error: lookupErr } = await supabase
    .from("marketing_contacts")
    .select("id, status")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (lookupErr) {
    console.error("subscribe/confirm: lookup failed", lookupErr);
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=error`
    );
  }
  if (!row) {
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=invalid`
    );
  }

  if (row.status === "confirmed") {
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=already`
    );
  }

  if (row.status !== "pending") {
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=unsubscribed`
    );
  }

  const { data: confirmed, error: updateErr } = await supabase
    .from("marketing_contacts")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("confirmation_token", token)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateErr || !confirmed) {
    console.error("subscribe/confirm: update failed", updateErr);
    return NextResponse.redirect(
      `${SITE_URL}/${locale}/subscribe?confirmed=error`
    );
  }

  return NextResponse.redirect(
    `${SITE_URL}/${locale}/subscribe?confirmed=ok`
  );
}

export async function GET(request: NextRequest) {
  try {
    return await confirm(request);
  } catch {
    console.error("subscribe/confirm: subscription service unavailable");
    return NextResponse.json({ error: "Subscription service unavailable. Please try again later." }, { status: 503 });
  }
}
