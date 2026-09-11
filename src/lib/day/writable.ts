import { getSession } from "@/lib/auth/session";
import {
  assertWritableDayDate,
  calendarDateInTimeZone,
  calendarToday,
} from "@/lib/day/dates";
import { getUserSettings } from "@/lib/settings";
import { DEFAULT_TIMEZONE } from "@/lib/telegram/reminder-clock";

export async function getUserCalendarToday(userId: string): Promise<string> {
  const settings = await getUserSettings(userId);
  return calendarDateInTimeZone(settings?.timezone ?? DEFAULT_TIMEZONE);
}

export async function assertUserDayWritable(
  userId: string,
  date: string,
): Promise<void> {
  const today = await getUserCalendarToday(userId);
  assertWritableDayDate(date, today);
}

export async function resolveRequestToday(): Promise<string> {
  const session = await getSession();
  if (!session) {
    return calendarToday();
  }
  return getUserCalendarToday(session.userId);
}
