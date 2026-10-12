import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.sentry.io https://generativelanguage.googleapis.com",
  "frame-ancestors https://web.telegram.org https://*.telegram.org",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  outputFileTracingIncludes: {
    "/api/share/card": ["./src/assets/fonts/**/*"],
  },
  productionBrowserSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
  async headers() {
    const security = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Content-Security-Policy",
        value: csp,
      },
    ];
    return [
      { source: "/:path*", headers: security },
      {
        source: "/p/:path*",
        headers: [
          ...security,
          {
            key: "Content-Security-Policy",
            value: `${csp}; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
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
