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

export function inclusiveDayCount(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Consecutive days in [from, to] with none of the given dates. */
export function longestDateGap(
  from: string,
  to: string,
  dates: string[],
): number {
  const sorted = [...new Set(dates)].sort((left, right) =>
    left.localeCompare(right),
  );
  if (sorted.length === 0) {
    return inclusiveDayCount(from, to);
  }

  let longest = 0;
  let cursor = from;
  for (const date of sorted) {
    if (date > cursor) {
      longest = Math.max(
        longest,
        inclusiveDayCount(cursor, shiftIsoDate(date, -1)),
      );
    }
    cursor = shiftIsoDate(date, 1);
  }
  if (cursor <= to) {
    longest = Math.max(longest, inclusiveDayCount(cursor, to));
  }
  return longest;
}

/** Calendar week starting Monday, from an ISO date. */
export function weekStartMonday(isoDate: string): string {
  if (!isIsoDate(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return shiftIsoDate(isoDate, -offset);
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

/** Today plus this many previous calendar days stay fully editable. */
export const WRITABLE_DAY_LOOKBACK = 2;

/** Empty days this far back can still be filled, marked as catch-up. */
export const CATCH_UP_DAY_LOOKBACK = 7;

export interface DayWriteState {
  caught_up: boolean;
  has_food: boolean;
}

export function earliestWritableDayDate(today: string): string {
  return shiftIsoDate(today, -WRITABLE_DAY_LOOKBACK);
}

export function earliestCatchUpDayDate(today: string): string {
  return shiftIsoDate(today, -CATCH_UP_DAY_LOOKBACK);
}

function isDateOnOrBefore(date: string, today: string): boolean {
  return isIsoDate(date) && isIsoDate(today) && date <= today;
}

export function isHonestWritableDayDate(date: string, today: string): boolean {
  return (
    isDateOnOrBefore(date, today) && date >= earliestWritableDayDate(today)
  );
}

export function isCatchUpWindowDate(date: string, today: string): boolean {
  return (
    isDateOnOrBefore(date, today) &&
    date >= earliestCatchUpDayDate(today) &&
    date < earliestWritableDayDate(today)
  );
}

/** Date sits in the honest window or the catch-up lookback. */
export function isWritableDayDate(date: string, today: string): boolean {
  return isDateOnOrBefore(date, today) && date >= earliestCatchUpDayDate(today);
}

export function writeStateFromDay(
  day: {
    caught_up: boolean;
    meals: Array<{ items: unknown[] }>;
  } | null,
): DayWriteState | null {
  if (!day) {
    return null;
  }

  return {
    caught_up: day.caught_up,
    has_food: day.meals.some((meal) => meal.items.length > 0),
  };
}

export function writeStateFromHistory(
  day: {
    caught_up: boolean;
    fact_protein: number;
    fact_fat: number;
    fact_carbs: number;
    fact_kcal: number;
  } | null,
): DayWriteState | null {
  if (!day) {
    return null;
  }

  return {
    caught_up: day.caught_up,
    has_food:
      day.fact_protein > 0 ||
      day.fact_fat > 0 ||
      day.fact_carbs > 0 ||
      day.fact_kcal > 0,
  };
}

export function isDayWritable(
  date: string,
  today: string,
  day: DayWriteState | null,
): boolean {
  if (!isWritableDayDate(date, today)) {
    return false;
  }
  if (isHonestWritableDayDate(date, today)) {
    return true;
  }
  return day == null || day.caught_up || !day.has_food;
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
