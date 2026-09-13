import { isWritableDayDate, shiftIsoDate } from "@/lib/day/dates";

export const WEEKDAY_LABELS = [
  "пн",
  "вт",
  "ср",
  "чт",
  "пт",
  "сб",
  "вс",
] as const;

const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

export interface MonthGridCell {
  date: string;
  inMonth: boolean;
  disabled: boolean;
  writable: boolean;
}

export function isYearMonth(value: string): boolean {
  if (!YEAR_MONTH_PATTERN.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);
  if (year == null || month == null || month < 1 || month > 12) {
    return false;
  }

  return (
    new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 7) === value
  );
}

export function yearMonthFromIso(date: string): string {
  return date.slice(0, 7);
}

export function shiftYearMonth(yearMonth: string, months: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1))
    .toISOString()
    .slice(0, 7);
}

export function clampYearMonth(yearMonth: string, today: string): string {
  const todayMonth = yearMonthFromIso(today);
  return yearMonth > todayMonth ? todayMonth : yearMonth;
}

export function canShiftYearMonthForward(
  yearMonth: string,
  today: string,
): boolean {
  return shiftYearMonth(yearMonth, 1) <= yearMonthFromIso(today);
}

export function monthGridStart(yearMonth: string): string {
  return shiftIsoDate(`${yearMonth}-01`, -mondayOffset(yearMonth));
}

export function monthGrid(yearMonth: string, today: string): MonthGridCell[] {
  const start = monthGridStart(yearMonth);
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const length = Math.ceil((mondayOffset(yearMonth) + daysInMonth) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const date = shiftIsoDate(start, index);
    return {
      date,
      inMonth: date.startsWith(yearMonth),
      disabled: date > today,
      writable: isWritableDayDate(date, today),
    };
  });
}

function mondayOffset(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  const sundayIndex = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (sundayIndex + 6) % 7;
}
