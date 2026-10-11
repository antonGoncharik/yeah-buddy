import * as Sentry from "@sentry/nextjs";

import type { RemindersCronResult } from "@/lib/telegram/reminders";

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

export function captureServerError(
  error: unknown,
  tags?: Record<string, string>,
): void {
  if (!isSentryEnabled()) {
    return;
  }
  Sentry.withScope((scope) => {
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        scope.setTag(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

export function reportRemindersCronResult(result: RemindersCronResult): void {
  if (!isSentryEnabled()) {
    return;
  }
  Sentry.setContext("cron_reminders", {
    evening: result.evening,
    midday: result.midday,
  });
  const failed = result.evening.failed + result.midday.failed;
  if (failed > 0) {
    Sentry.captureMessage("reminder cron delivery failures", "warning");
  }
}
