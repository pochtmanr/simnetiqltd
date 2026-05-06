import { track as vercelTrack } from "@vercel/analytics";
import type { Locale } from "@/lib/i18n";

type ServiceCode = "mobile" | "web" | "ai" | "growth" | "automations";
type ProjectId = "physics" | "doppler" | "creator" | "delivery";
type ThemeValue = "system" | "light" | "dark";

export type AnalyticsEvent =
  | { name: "hero_cta_click"; props: { cta: "primary" | "secondary"; locale: Locale } }
  | { name: "service_card_view"; props: { service: ServiceCode; index: number; locale: Locale } }
  | { name: "service_card_click"; props: { service: ServiceCode; locale: Locale } }
  | { name: "project_card_click"; props: { project_id: ProjectId; locale: Locale } }
  | { name: "theme_change"; props: { from: ThemeValue; to: ThemeValue } }
  | { name: "locale_change"; props: { from: Locale; to: Locale } }
  | { name: "contact_section_view"; props: { locale: Locale } }
  | { name: "booking_widget_loaded"; props: { locale: Locale; tz_hint: string } }
  | { name: "booking_completed"; props: { locale: Locale; tz: string; event_type: string } }
  | { name: "message_form_submit"; props: { locale: Locale } }
  | { name: "message_form_error"; props: { locale: Locale; reason: string } }
  | { name: "contact_form_disclosed"; props: { locale: Locale } };

const CLIENT_ID_KEY = "simnetiq_client_id";

// Crockford-base32 ULID generator. 26 chars: 10 timestamp + 16 random.
const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(now: number): string {
  let out = "";
  let t = now;
  for (let i = 9; i >= 0; i--) {
    const mod = t % 32;
    out = ULID_ENCODING[mod] + out;
    t = (t - mod) / 32;
  }
  return out;
}

function encodeRandom(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += ULID_ENCODING[Math.floor((bytes[i % 10] / 256) * 32)];
  }
  return out;
}

function generateUlid(): string {
  return encodeTime(Date.now()) + encodeRandom();
}

function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = generateUlid();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function track<E extends AnalyticsEvent>(name: E["name"], props: E["props"]): void {
  if (typeof window === "undefined") return;
  const clientId = getClientId();
  const path = window.location.pathname;
  const payload: Record<string, string | number | boolean | null> = {
    ...(props as Record<string, string | number | boolean | null>),
    path,
  };
  if (clientId) payload.client_id = clientId;
  // Vercel Analytics has its own debug mode (?debug=1). console.log here is
  // intentional during the build-out period so engineers can verify catalog
  // events fire on the right interactions.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, payload);
  }
  vercelTrack(name, payload);
}
