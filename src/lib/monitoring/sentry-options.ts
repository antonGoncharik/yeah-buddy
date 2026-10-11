import type { Options } from "@sentry/core";

export function sentryEnvironment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

/** Must match the release name created during `next build` (Vercel git SHA or SENTRY_RELEASE). */
export function sentryRelease(): string | undefined {
  const raw = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;
  return raw && raw.length > 0 ? raw : undefined;
}

export function baseSentryInitOptions(dsn: string | undefined): Options {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: sentryEnvironment(),
    release: sentryRelease(),
    tracesSampleRate: sentryEnvironment() === "production" ? 0.05 : 0,
  };
}
