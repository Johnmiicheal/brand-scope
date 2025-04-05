import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizeCss: false  // Disable CSS optimization
  },
  api: {
    responseLimit: false,
    externalResolver: true,
    bodyParser: {
      sizeLimit: '10mb'
    },
    maxDuration: 600
  }
};

export default nextConfig;
