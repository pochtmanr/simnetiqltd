import type { NextConfig } from "next";
import { SITE_URL } from "./lib/site";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  // Without this the optimizer defaults to WebP only, so every .avif in
  // public/ is re-encoded LARGER than the source it was given.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    // The bot menu was saved as /tg. and that path 404s. Serve the mini app there.
    return [{ source: "/tg.", destination: "/tg" }];
  },
  async redirects() {
    return [
      // Consolidate old domains and www before locale or page routing.
      ...["simnetiq.store", "www.simnetiq.store", "www.simnetiq.com"].map(
        (host) => ({
          source: "/:path*",
          has: [{ type: "host" as const, value: host.replaceAll(".", "\\.") }],
          destination: `${SITE_URL}/:path*`,
          permanent: true,
        })
      ),
      {
        source: "/:locale(en|he|ru)/services/ai-integration",
        destination: "/:locale/services/ai-automation",
        permanent: true,
      },
      // SMS Activate was rebranded to SMS Code in Aug 2026. The old slug had
      // been indexed for a year, so it keeps a permanent redirect rather than
      // 404ing — including the /markdown agent variant.
      {
        source: "/:locale(en|he|ru)/projects/sms-activate",
        destination: "/:locale/projects/sms-code",
        permanent: true,
      },
      {
        source: "/:locale(en|he|ru)/projects/sms-activate/markdown",
        destination: "/:locale/projects/sms-code/markdown",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
