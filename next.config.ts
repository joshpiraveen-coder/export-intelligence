import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Don't advertise the framework, and never ship browser source maps —
  // keeps the client bundle to minified/mangled JS only.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
