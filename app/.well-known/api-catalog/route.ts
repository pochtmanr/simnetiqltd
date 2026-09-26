import { LOCALES } from "@/lib/i18n";
import { MD_ROUTES } from "@/lib/agent-routes";
import { CONTENT_SIGNAL } from "@/lib/markdown-negotiation";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

type LinksetEntry = {
  anchor: string;
  "service-desc": { href: string; type: string }[];
  "service-doc": { href: string; type: string }[];
  alternate: { href: string; type: string }[];
};

function buildLinkset(): { linkset: LinksetEntry[] } {
  const linkset: LinksetEntry[] = [];
  for (const locale of LOCALES) {
    for (const route of MD_ROUTES) {
      const anchor = `${SITE_URL}/${locale}${route.path}`;
      linkset.push({
        anchor,
        "service-desc": [
          { href: `${anchor}/markdown`, type: "text/markdown" },
        ],
        "service-doc": [{ href: anchor, type: "text/html" }],
        alternate: [
          {
            href: `${SITE_URL}/${locale}/llms-full.txt`,
            type: "text/markdown",
          },
        ],
      });
    }
  }
  return { linkset };
}

export async function GET() {
  return new Response(JSON.stringify(buildLinkset(), null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Signal": CONTENT_SIGNAL,
    },
  });
}
