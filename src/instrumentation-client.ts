import * as Sentry from "@sentry/nextjs";

import { baseSentryInitOptions } from "@/lib/monitoring/sentry-options";

// Client Sentry is opt-in only. Do not use SENTRY_DSN here — on Vercel it stays
// server-only; NEXT_PUBLIC_* would expose the DSN in the browser bundle.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init(baseSentryInitOptions(dsn));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
