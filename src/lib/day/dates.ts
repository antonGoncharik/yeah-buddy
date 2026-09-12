import {
  DAY_EXISTS_REPLACE,
  MEAL_EXISTS_REPLACE,
  PAST_DAY_LOCKED,
  SOURCE_MEAL_EMPTY,
  YESTERDAY_MEAL_EMPTY,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { localClock } from "@/lib/telegram/reminder-clock";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class DayConflictError extends Error {
  readonly code = "DAY_EXISTS";

  constructor() {
    super(DAY_EXISTS_REPLACE);
  }
}

export class YesterdayMissingError extends Error {
  constructor() {
    super(YESTERDAY_MISSING);
  }
}

export class YesterdayMealEmptyError extends Error {
  constructor() {
    super(YESTERDAY_MEAL_EMPTY);
  }
}

export class SourceDayMissingError extends Error {
  constructor() {
    super("В этот день записей нет.");
  }
}

export class SourceMealEmptyError extends Error {
  constructor() {
    super(SOURCE_MEAL_EMPTY);
  }
}

export class MealConflictError extends Error {
  readonly code = "MEAL_EXISTS";

  constructor() {
    super(MEAL_EXISTS_REPLACE);
  }
}

export class PastDayLockedError extends Error {
  constructor() {
    super(PAST_DAY_LOCKED);
  }
}

export function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (year == null || month == null || day == null) {
    return false;
  }

  return (
    new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) ===
    value
  );
}

export function previousIsoDate(date: string): string {
  return shiftIsoDate(date, -1);
}

export function nextIsoDate(date: string): string {
  return shiftIsoDate(date, 1);
}

export function shiftIsoDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function calendarToday(): string {
  return calendarDateInTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
}

export function calendarDateInTimeZone(
  timeZone: string,
  now = new Date(),
): string {
  return localClock(now, timeZone).date;
}

export function isPastDayDate(date: string, today = calendarToday()): boolean {
  return isIsoDate(date) && date < today;
}

export function isWritableDayDate(date: string, today: string): boolean {
  if (!isIsoDate(date) || !isIsoDate(today)) {
    return false;
  }

  return date === today || date === previousIsoDate(today);
}

export function assertWritableDayDate(date: string, today: string): void {
  if (!isWritableDayDate(date, today)) {
    throw new PastDayLockedError();
  }
}

export function todayHomeHref(
  date: string | null | undefined,
  today = calendarToday(),
): string {
  if (!date || !isIsoDate(date) || date >= today) {
    return "/today";
  }

  return `/today?date=${encodeURIComponent(date)}`;
}

export function withDateQuery(
  path: string,
  date: string | null | undefined,
  today = calendarToday(),
): string {
  if (!date || !isIsoDate(date) || date >= today) {
    return path;
  }

  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}date=${encodeURIComponent(date)}`;
}

export function nutritionHistoryHref(fromSettings = false): string {
  return fromSettings ? "/today/history?from=settings" : "/today/history";
}

export function nutritionWeekHref(fromSettings = false): string {
  return fromSettings ? "/today/week?from=settings" : "/today/week";
}

export function todayHistoryDayHref(
  date: string,
  fromSettings = false,
  today = calendarToday(),
): string {
  const params = new URLSearchParams();
  if (date && isIsoDate(date) && date < today) {
    params.set("date", date);
  }
  params.set("view", "history");
  if (fromSettings) {
    params.set("from", "settings");
  }
  return `/today?${params.toString()}`;
}
