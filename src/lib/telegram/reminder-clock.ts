import { previousIsoDate } from "@/lib/day/dates";
import { saveUserTimezone } from "@/lib/settings";

export const DEFAULT_TIMEZONE = "Europe/Moscow";
export const REMINDER_HOUR = 21;
/** Local hour (inclusive) when a midday nudge may fire for new users. */
export const MIDDAY_REMINDER_HOUR = 13;

export function resolveTimeZone(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.length > 64) {
    return DEFAULT_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function localClock(
  now: Date,
  timeZone: string,
): { date: string; hour: number } {
  const zone = resolveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(read("hour"));

  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number.isFinite(hour) ? hour : 0,
  };
}

/** Local calendar date to remind for, or null if 21:00 has not arrived. */
/** Evening summary date: today after the chosen hour, or yesterday during 00:00–02:59 catch-up. */
export function eveningReminderDateForCandidate(
  clock: {
    date: string;
    hour: number;
  },
  remindedOn: string | null,
  eveningHour: number = REMINDER_HOUR,
): string | null {
  const dueToday = reminderDateIfDue(clock, eveningHour);
  if (dueToday) {
    return dueToday;
  }
  if (clock.hour >= 3) {
    return null;
  }
  const yesterday = previousIsoDate(clock.date);
  if (remindedOn === yesterday) {
    return null;
  }
  if (remindedOn != null && remindedOn >= yesterday) {
    return null;
  }
  return yesterday;
}

export function reminderDateIfDue(
  clock: {
    date: string;
    hour: number;
  },
  eveningHour: number = REMINDER_HOUR,
): string | null {
  const hour = normalizeReminderHour(eveningHour);
  if (clock.hour < hour) {
    return null;
  }

  return clock.date;
}

export function normalizeReminderHour(value: number): number {
  if (value >= 17 && value <= 23) {
    return value;
  }
  return REMINDER_HOUR;
}

/** Local calendar date for a midday nudge, or null outside the midday window. */
export function middayReminderDateIfDue(
  clock: {
    date: string;
    hour: number;
  },
  eveningHour: number = REMINDER_HOUR,
): string | null {
  const end = normalizeReminderHour(eveningHour);
  if (clock.hour < MIDDAY_REMINDER_HOUR || clock.hour >= end) {
    return null;
  }
  return clock.date;
}

export function isoWeekdaySun0(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isCronAuthorized(
  request: Request,
  secret: string | undefined,
): boolean {
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function rememberUserTimezone(
  userId: string,
  timeZone: string | null | undefined,
): Promise<void> {
  if (!timeZone) {
    return;
  }

  try {
    await saveUserTimezone(userId, resolveTimeZone(timeZone));
  } catch (error) {
    console.error(error);
  }
}
