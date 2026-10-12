import { shiftIsoDate } from "@/lib/day/dates";

/** Monday of the ISO week that contains `date` (UTC calendar date). */
export function calendarWeekStart(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  const weekday = utc.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return shiftIsoDate(date, -offset);
}
