import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { MD_ROUTES } from "@/lib/agent-routes";

const LOCALE_COOKIE = "NEXT_LOCALE";

// Every page path (after the locale segment) the app serves. Anything else —
// mostly old eSIM-store URLs Google still has indexed — is sent to the home
// page instead of 404ing.
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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathLocale = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (pathLocale) {
    if (isKnownPath(pathname.slice(pathLocale.length + 1))) return;
    const home = request.nextUrl.clone();
    home.pathname = `/${pathLocale}`;
    home.search = "";
    return NextResponse.redirect(home, 308);
  }

  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  const cookieLocale =
    cookieValue && isLocale(cookieValue) ? cookieValue : null;
  const locale =
    cookieLocale ??
    pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  const target = request.nextUrl.clone();
  let response: NextResponse;
  if (isKnownPath(pathname === "/" ? "" : pathname)) {
    target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    target.search = search;
    response = NextResponse.redirect(target);
  } else {
    target.pathname = `/${locale}`;
    target.search = "";
    response = NextResponse.redirect(target, 308);
  }

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
