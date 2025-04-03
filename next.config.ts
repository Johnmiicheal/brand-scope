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
    // Set max duration to 60 seconds (Hobby plan max)
    maxDuration: 60
  }
};

export default nextConfig;
