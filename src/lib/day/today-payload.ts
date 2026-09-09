import type { DayWithMeals } from "@/lib/days";

export function readDay(data: unknown): DayWithMeals | null {
  if (!data || typeof data !== "object" || !("day" in data) || !data.day) {
    return null;
  }

  return data.day as DayWithMeals;
}
