import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  // Without this the optimizer defaults to WebP only, so every .avif in
  // public/ is re-encoded LARGER than the source it was given.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
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
