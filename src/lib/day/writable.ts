import { getSession } from "@/lib/auth/session";
import {
  calendarDateInTimeZone,
  calendarToday,
  isCatchUpWindowDate,
  isDayWritable,
  isHonestWritableDayDate,
  PastDayLockedError,
  writeStateFromDay,
} from "@/lib/day/dates";
import { getDayByDate, markDayCaughtUp } from "@/lib/day/store";
import { getUserSettings } from "@/lib/settings";
import { DEFAULT_TIMEZONE } from "@/lib/telegram/reminder-clock";

export async function getUserCalendarToday(userId: string): Promise<string> {
  const settings = await getUserSettings(userId);
  return calendarDateInTimeZone(settings?.timezone ?? DEFAULT_TIMEZONE);
}

export async function assertUserDayWritable(
  userId: string,
  date: string,
): Promise<{ catchUp: boolean }> {
  const today = await getUserCalendarToday(userId);
  if (isHonestWritableDayDate(date, today)) {
    return { catchUp: false };
  }
  if (!isCatchUpWindowDate(date, today)) {
    throw new PastDayLockedError();
  }

  const day = await getDayByDate(userId, date);
  if (!isDayWritable(date, today, writeStateFromDay(day))) {
    throw new PastDayLockedError();
  }
  if (day && !day.caught_up) {
    await markDayCaughtUp(userId, day.id);
  }
  return { catchUp: true };
}

export async function resolveRequestToday(): Promise<string> {
  const session = await getSession();
  if (!session) {
    return calendarToday();
  }
  return getUserCalendarToday(session.userId);
}
