import { isIsoDate, isWritableDayDate } from "@/lib/day/dates";
import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import type { RecipeLine } from "@/lib/day/remaining";
import { isMealType } from "@/lib/nutrition";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNumber,
} from "@/lib/read";
import type { CopyDayHint, MealType, NamedMealHint } from "@/lib/types";

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

export function readCalendarToday(data: unknown): string | null {
  if (!isRecord(data) || typeof data.today !== "string") {
    return null;
  }
  return isIsoDate(data.today) ? data.today : null;
}

export function readDayWritable(
  data: unknown,
  date: string,
  today: string,
): boolean {
  if (isRecord(data) && typeof data.writable === "boolean") {
    return data.writable;
  }
  return isWritableDayDate(date, today);
}

export function readCopyDays(data: unknown): CopyDayHint[] {
  if (!isRecord(data)) {
    return [];
  }
  return mapRecordList(data.copyDays, (row) => {
    if (typeof row.date !== "string" || !isIsoDate(row.date)) {
      return null;
    }
    if (!Array.isArray(row.mealTypes)) {
      return null;
    }
    const mealTypes = row.mealTypes.filter(isMealType);
    if (mealTypes.length === 0) {
      return null;
    }
    return { date: row.date, mealTypes };
  });
}

export function readNamedMeals(data: unknown): NamedMealHint[] {
  if (!isRecord(data)) {
    return [];
  }
  return mapRecordList(data.namedMeals, (row) => {
    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      !isMealType(row.meal_type)
    ) {
      return null;
    }
    return { id: row.id, name: row.name, meal_type: row.meal_type };
  });
}

export function readRecipes(data: unknown): {
  rest: RecipeLine[];
  training: RecipeLine[];
} {
  if (!isRecord(data) || !isRecord(data.recipes)) {
    return { rest: [], training: [] };
  }
  return {
    rest: readRecipeLines(data.recipes.rest),
    training: readRecipeLines(data.recipes.training),
  };
}

function readRecipeLines(value: unknown): RecipeLine[] {
  return mapRecordList(value, (row) => {
    if (
      typeof row.foodId !== "string" ||
      typeof row.name !== "string" ||
      !isMealType(row.mealType)
    ) {
      return null;
    }
    const grams = toNumber(row.grams);
    if (!(grams > 0)) {
      return null;
    }
    return {
      foodId: row.foodId,
      name: row.name,
      grams,
      mealType: row.mealType,
    };
  });
}
