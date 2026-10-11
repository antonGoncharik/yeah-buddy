import * as Sentry from "@sentry/nextjs";

import { baseSentryInitOptions } from "@/lib/monitoring/sentry-options";

export async function register(): Promise<void> {
  const options = baseSentryInitOptions(process.env.SENTRY_DSN);
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(options);
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(options);
  }
}

export const onRequestError = Sentry.captureRequestError;
