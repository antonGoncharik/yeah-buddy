import {
  DAY_EXISTS_REPLACE,
  MEAL_EXISTS_REPLACE,
  PAST_DAY_LOCKED,
  YESTERDAY_MEAL_EMPTY,
  YESTERDAY_MISSING,
} from "@/lib/messages";

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

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function previousIsoDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return previous.toISOString().slice(0, 10);
}

export function nextIsoDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

export function calendarToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDayDate(date: string): boolean {
  return isIsoDate(date) && date < calendarToday();
}

export function assertWritableDayDate(date: string): void {
  if (isPastDayDate(date)) {
    throw new PastDayLockedError();
  }
}

export function todayHomeHref(date: string | null | undefined): string {
  if (!date || !isIsoDate(date) || date >= calendarToday()) {
    return "/today";
  }

  return `/today?date=${encodeURIComponent(date)}`;
}

export function withDateQuery(
  path: string,
  date: string | null | undefined,
): string {
  if (!date || !isIsoDate(date) || date >= calendarToday()) {
    return path;
  }

  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}date=${encodeURIComponent(date)}`;
}

export function nutritionHistoryHref(fromSettings = false): string {
  return fromSettings ? "/today/history?from=settings" : "/today/history";
}

export function todayHistoryDayHref(
  date: string,
  fromSettings = false,
): string {
  const params = new URLSearchParams();
  if (date && isIsoDate(date) && date < calendarToday()) {
    params.set("date", date);
  }
  params.set("view", "history");
  if (fromSettings) {
    params.set("from", "settings");
  }
  return `/today?${params.toString()}`;
}
