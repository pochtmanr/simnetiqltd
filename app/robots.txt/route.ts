import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

// Only the API surface is blocked. Next's static chunks must stay crawlable:
// the homepage renders through a client component, so a crawler that can't
// fetch /_next/static/chunks/ renders a near-empty page.
const BLOCKED = ["/api/"];

const USER_AGENTS: { ua: string; allow: string; disallow?: string[] }[] = [
  { ua: "*", allow: "/", disallow: BLOCKED },
  { ua: "Googlebot", allow: "/", disallow: BLOCKED },
  { ua: "Googlebot-Image", allow: "/" },
  { ua: "Googlebot-News", allow: "/", disallow: BLOCKED },
  { ua: "Bingbot", allow: "/", disallow: BLOCKED },
  { ua: "DuckDuckBot", allow: "/", disallow: BLOCKED },
  { ua: "YandexBot", allow: "/", disallow: BLOCKED },
  { ua: "Applebot", allow: "/", disallow: BLOCKED },
  // AI overview / answer engines — opt in so case studies surface in
  // Perplexity, ChatGPT browsing, Claude search, etc.
  { ua: "OAI-SearchBot", allow: "/", disallow: BLOCKED },
  { ua: "PerplexityBot", allow: "/", disallow: BLOCKED },
  { ua: "ClaudeBot", allow: "/", disallow: BLOCKED },
  { ua: "Claude-Web", allow: "/", disallow: BLOCKED },
];

function buildRobotsTxt(): string {
  const blocks = USER_AGENTS.map((rule) => {
    const lines: string[] = [`User-agent: ${rule.ua}`, `Allow: ${rule.allow}`];
    for (const path of rule.disallow ?? []) lines.push(`Disallow: ${path}`);
    return lines.join("\n");
  });

  // Sitemap, host, and the LLMs-Txt directive go after the user-agent
  // blocks per common crawler convention. LLMs-Txt is a non-standard
  // hint that AI crawlers (and audit tools like agentindexc.com) read
  // to discover the llmstxt.org-spec file.
  const trailer = [
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    `LLMs-Txt: ${SITE_URL}/llms.txt`,
  ].join("\n");

  return `${blocks.join("\n\n")}\n\n${trailer}\n`;
}

export async function GET() {
  return new Response(buildRobotsTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
