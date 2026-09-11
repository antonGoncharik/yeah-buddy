import { saveUserTimezone } from "@/lib/settings";

export const DEFAULT_TIMEZONE = "Europe/Moscow";
export const REMINDER_HOUR = 20;

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

export function isReminderHour(hour: number): boolean {
  return hour === REMINDER_HOUR;
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
