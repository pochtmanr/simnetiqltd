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
    ];
  },
};

export default nextConfig;
