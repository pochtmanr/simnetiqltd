import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      {
        source: "/:locale(en|he)/services/ai-integration",
        destination: "/:locale/services/ai-automation",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
