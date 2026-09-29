import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Student registration carries a recitation recording or uploaded
      // audio file (capped at 8 MB in the form); the 1 MB default is too small.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
