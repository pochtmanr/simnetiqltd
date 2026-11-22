import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { MD_ROUTES } from "@/lib/agent-routes";

const LOCALE_COOKIE = "NEXT_LOCALE";

// Every page path (after the locale segment) the app serves. Only these get the
// locale redirect when requested without a prefix. Anything else falls through
// to the router and gets a real 404 — a blanket redirect to the home page is a
// soft 404 to search engines.
const KNOWN_PATHS = new Set<string>([
  ...MD_ROUTES.flatMap((r) => [r.path, `${r.path}/markdown`]),
  "/legal",
  "/privacy-policy",
  "/delete-account",
  "/subscribe",
  "/unsubscribe",
]);

function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .filter(Boolean);
  for (const c of candidates) {
    const base = c.split("-")[0];
    if (base && isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

function isKnownPath(path: string): boolean {
  return KNOWN_PATHS.has(path.replace(/\/+$/, ""));
}

const PRIVATE_PREFIXES = ["/admin", "/tg", "/login"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale) return;
  if (!isKnownPath(pathname === "/" ? "" : pathname)) return;

  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  const cookieLocale =
    cookieValue && isLocale(cookieValue) ? cookieValue : null;
  const locale =
    cookieLocale ??
    pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  const target = request.nextUrl.clone();
  target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  target.search = search;

  const response = NextResponse.redirect(target);
  if (cookieLocale !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|api|.*\\..*|sitemap.xml|robots.txt|favicon.ico).*)",
  ],
};
