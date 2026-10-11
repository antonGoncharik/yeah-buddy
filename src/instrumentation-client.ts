import * as Sentry from "@sentry/nextjs";

// Client Sentry is opt-in only. Do not use SENTRY_DSN here — on Vercel it stays
// server-only; NEXT_PUBLIC_* would expose the DSN in the browser bundle.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
});
