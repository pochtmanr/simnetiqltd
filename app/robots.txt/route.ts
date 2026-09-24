import { SITE_URL } from "@/lib/seo-meta";

export const dynamic = "force-static";
export const revalidate = 86400;

const BLOCKED = ["/api/", "/_next/static/chunks/"];

// AI-agent UAs we still want to allow on marketing pages but should NOT
// crawl the privacy policy or delete-account flows. Those routes exist
// purely for App Store / Google Play compliance — surfacing them as
// answers to "what is simnetiq.com?" would be misleading.
const AI_AGENT_UAS = [
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
];

const LEGAL_DISALLOWS = ["/*/privacy-policy", "/*/delete-account"];

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
  // Perplexity, ChatGPT browsing, Claude search, etc. — but block them
  // from the legal/compliance routes.
  ...AI_AGENT_UAS.map((ua) => ({
    ua,
    allow: "/",
    disallow: [...BLOCKED, ...LEGAL_DISALLOWS],
  })),
];

function buildRobotsTxt(): string {
  const blocks = USER_AGENTS.map((rule) => {
    const lines: string[] = [`User-agent: ${rule.ua}`, `Allow: ${rule.allow}`];
    for (const path of rule.disallow ?? []) lines.push(`Disallow: ${path}`);
    return lines.join("\n");
  });

  // Sitemap, host, Content-Signal and the LLMs-Txt directive go after the
  // user-agent blocks per common crawler convention.
  // - Content-Signal (contentsignals.org / IETF draft-romm-aipref-contentsignals)
  //   declares site-wide AI usage policy: indexing + runtime AI input are
  //   permitted, training-corpus use is not.
  // - LLMs-Txt is a non-standard hint that AI crawlers (and audit tools
  //   like isitagentready.com) read to discover the llmstxt.org-spec file.
  const trailer = [
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    `Content-Signal: search=yes, ai-input=yes, ai-train=no`,
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
