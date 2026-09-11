import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import { isMealType } from "@/lib/nutrition";
import { isRecord, toNullableNumber } from "@/lib/read";
import type { MealType } from "@/lib/types";

export function readDay(data: unknown): DayWithMeals | null {
  if (!isRecord(data) || !isRecord(data.day)) {
    return null;
  }

  return mapDayWithMeals(data.day);
}

export function readYesterdayExists(data: unknown): boolean {
  return isRecord(data) && data.yesterdayExists === true;
}

export function readYesterdayMealTypes(data: unknown): MealType[] {
  if (!isRecord(data) || !Array.isArray(data.yesterdayMealTypes)) {
    return [];
  }

  return data.yesterdayMealTypes.filter(isMealType);
}

export function readLastBodyWeight(data: unknown): number | null {
  if (!isRecord(data)) {
    return null;
  }

  return toNullableNumber(data.lastBodyWeight);
}
