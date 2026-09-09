import { type DayWithMeals, mapDayWithMeals } from "@/lib/days";
import { isRecord } from "@/lib/read";

export function readDay(data: unknown): DayWithMeals | null {
  if (!isRecord(data) || !isRecord(data.day)) {
    return null;
  }

  return mapDayWithMeals(data.day);
}
