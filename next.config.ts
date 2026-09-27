import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  outputFileTracingIncludes: {
    "/api/share/card": ["./src/assets/fonts/**/*"],
  },
};

export default nextConfig;
