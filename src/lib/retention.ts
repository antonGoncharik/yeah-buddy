import { calendarDateInTimeZone, inclusiveDayCount } from "@/lib/day/dates";
import { DEFAULT_TIMEZONE } from "@/lib/telegram/reminder-clock";

/** Calendar days after onboarding, inclusive of day 0. */
export const RETENTION_TAIL_DAYS = 3;

export type EmptyStartCopy = "repeat" | "scan";

export function onboardingAgeDays(
  onboardedAt: string | null | undefined,
  today: string,
  timeZone = DEFAULT_TIMEZONE,
): number | null {
  if (!onboardedAt) {
    return null;
  }
  const at = new Date(onboardedAt);
  if (!Number.isFinite(at.getTime())) {
    return null;
  }
  const start = calendarDateInTimeZone(timeZone, at);
  if (today < start) {
    return null;
  }
  return inclusiveDayCount(start, today) - 1;
}

export function inRetentionTail(ageDays: number | null): boolean {
  return ageDays != null && ageDays >= 0 && ageDays < RETENTION_TAIL_DAYS;
}

export function emptyStartCopy(input: {
  retentionTail: boolean;
  isToday: boolean;
  viewOnly: boolean;
  dayHasItems: boolean;
  yesterdayHasFood: boolean;
}): EmptyStartCopy | null {
  if (
    !input.retentionTail ||
    !input.isToday ||
    input.viewOnly ||
    input.dayHasItems
  ) {
    return null;
  }
  return input.yesterdayHasFood ? "repeat" : "scan";
}
