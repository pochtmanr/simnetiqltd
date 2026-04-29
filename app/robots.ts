import type { MetadataRoute } from "next";

const SITE_URL = "https://simnetiq.store";

export default function robots(): MetadataRoute.Robots {
  // Default rule covers every crawler. The named rules exist so that the
  // image / news bots, AI training crawlers, and the major search engines
  // each get an explicit, auditable line in robots.txt.
  const blocked = ["/api/", "/_next/static/chunks/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: blocked,
      },
      { userAgent: "Googlebot", allow: "/", disallow: blocked },
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Googlebot-News", allow: "/", disallow: blocked },
      { userAgent: "Bingbot", allow: "/", disallow: blocked },
      { userAgent: "DuckDuckBot", allow: "/", disallow: blocked },
      { userAgent: "YandexBot", allow: "/", disallow: blocked },
      { userAgent: "Applebot", allow: "/", disallow: blocked },
      // AI overview / answer engines — opt in so our case studies
      // surface in Perplexity, ChatGPT browsing, Claude search etc.
      { userAgent: "OAI-SearchBot", allow: "/", disallow: blocked },
      { userAgent: "PerplexityBot", allow: "/", disallow: blocked },
      { userAgent: "ClaudeBot", allow: "/", disallow: blocked },
      { userAgent: "Claude-Web", allow: "/", disallow: blocked },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
