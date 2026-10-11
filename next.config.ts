import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  outputFileTracingIncludes: {
    "/api/share/card": ["./src/assets/fonts/**/*"],
  },
  productionBrowserSourceMaps: true,
};

const sentryOrg = process.env.SENTRY_ORG ?? "antgoncharikgmailcom";
const sentryProject = process.env.SENTRY_PROJECT ?? "yeah-buddy";

export default withSentryConfig(nextConfig, {
  org: sentryOrg,
  project: sentryProject,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  _experimental: {
    vercelCronsMonitoring: true,
  },
});
