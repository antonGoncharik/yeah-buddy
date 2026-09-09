import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import { isRecord } from "@/lib/read";

export function readDay(data: unknown): DayWithMeals | null {
  if (!isRecord(data) || !isRecord(data.day)) {
    return null;
  }

  return mapDayWithMeals(data.day);
}
