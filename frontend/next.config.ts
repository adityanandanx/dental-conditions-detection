import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable telemetry for production builds
  experimental: {
    serverComponentsExternalPackages: ["dcmjs-imaging"],
  },
};

export default nextConfig;
