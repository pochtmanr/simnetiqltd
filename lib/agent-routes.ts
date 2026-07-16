import { getAllServiceSlugs } from "@/lib/services";
import { LOCALES, type Locale } from "@/lib/i18n";

export type MdRouteKind =
  | "home"
  | "about"
  | "servicesIndex"
  | "service"
  | "projectsIndex"
  | "project";

export type MdRoute = {
  /** Path AFTER the locale segment, e.g. "/about" or "/services/mobile-desktop". Empty string for the home route. */
  path: string;
  kind: MdRouteKind;
  /** When kind === "service" or "project". */
  slug?: string;
};

const PROJECT_SLUGS = [
  "doppler-vpn",
  "physics-explained",
  "green-flagged",
  "sms-activate",
  "visapassage",
] as const;

function buildRoutes(): MdRoute[] {
  const out: MdRoute[] = [
    { path: "", kind: "home" },
    { path: "/about", kind: "about" },
    { path: "/services", kind: "servicesIndex" },
    { path: "/projects", kind: "projectsIndex" },
  ];
  for (const slug of getAllServiceSlugs()) {
    out.push({ path: `/services/${slug}`, kind: "service", slug });
  }
  for (const slug of PROJECT_SLUGS) {
    out.push({ path: `/projects/${slug}`, kind: "project", slug });
  }
  return out;
}

export const MD_ROUTES: readonly MdRoute[] = buildRoutes();

const PATH_TO_ROUTE = new Map<string, MdRoute>(
  MD_ROUTES.map((r) => [r.path, r])
);

/** Locale-prefixed path for a given route, e.g. ("en", "/about") → "/en/about". */
export function localePath(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}

/**
 * Match an incoming pathname like "/en/services/mobile-desktop" to a known
 * MD route. Returns null when the path isn't an MD-supported page.
 */
export function matchPathname(pathname: string): {
  locale: Locale;
  route: MdRoute;
} | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const [first, ...rest] = parts;
  if (!(LOCALES as readonly string[]).includes(first)) return null;
  const locale = first as Locale;
  const tail = rest.length === 0 ? "" : `/${rest.join("/")}`;
  const route = PATH_TO_ROUTE.get(tail);
  if (!route) return null;
  return { locale, route };
}

/** Markdown URL for a given locale + route. */
export function markdownUrlFor(
  siteUrl: string,
  locale: Locale,
  path: string
): string {
  return `${siteUrl}/${locale}${path}/markdown`;
}
