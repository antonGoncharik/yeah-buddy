import * as Sentry from "@sentry/nextjs";

function sentryOptions(): Parameters<typeof Sentry.init>[0] {
  const dsn = process.env.SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  };
}

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(sentryOptions());
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(sentryOptions());
  }
}

export const onRequestError = Sentry.captureRequestError;
