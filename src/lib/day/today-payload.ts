import { isIsoDate, isWritableDayDate } from "@/lib/day/dates";
import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import type { RecipeLine } from "@/lib/day/remaining";
import {
  DEFAULT_REST_MACRO_GOALS,
  DEFAULT_TRAINING_MACRO_GOALS,
  isMealType,
} from "@/lib/nutrition";
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

export function readLastWaist(data: unknown): number | null {
  if (!isRecord(data)) {
    return null;
  }

  return toNullableNumber(data.lastWaist);
}

export function readLastWaistDate(data: unknown): string | null {
  if (!isRecord(data) || typeof data.lastWaistDate !== "string") {
    return null;
  }
  return isIsoDate(data.lastWaistDate) ? data.lastWaistDate : null;
}

export function readAccountAgeDays(data: unknown): number | null {
  if (!isRecord(data) || typeof data.accountAgeDays !== "number") {
    return null;
  }
  if (!Number.isInteger(data.accountAgeDays) || data.accountAgeDays < 0) {
    return null;
  }
  return data.accountAgeDays;
}

export interface MacroGoals {
  restProtein: number;
  restCarbs: number;
  trainingProtein: number;
  trainingCarbs: number;
}

export function readMacroGoals(data: unknown): MacroGoals {
  const fallback: MacroGoals = {
    restProtein: DEFAULT_REST_MACRO_GOALS.protein,
    restCarbs: DEFAULT_REST_MACRO_GOALS.carbs,
    trainingProtein: DEFAULT_TRAINING_MACRO_GOALS.protein,
    trainingCarbs: DEFAULT_TRAINING_MACRO_GOALS.carbs,
  };
  if (!isRecord(data) || !isRecord(data.goals)) {
    return fallback;
  }
  return {
    restProtein: macroOr(data.goals.restProtein, fallback.restProtein),
    restCarbs: macroOr(data.goals.restCarbs, fallback.restCarbs),
    trainingProtein: macroOr(
      data.goals.trainingProtein,
      fallback.trainingProtein,
    ),
    trainingCarbs: macroOr(data.goals.trainingCarbs, fallback.trainingCarbs),
  };
}

function macroOr(value: unknown, fallback: number): number {
  const parsed = toNumber(value);
  return parsed >= 0 ? parsed : fallback;
}

export function readWeightSteady(data: unknown): boolean {
  return isRecord(data) && data.weightSteady === true;
}

export function readPriorProteinHits(data: unknown): number {
  if (!isRecord(data) || typeof data.priorProteinHits !== "number") {
    return 0;
  }
  if (!Number.isInteger(data.priorProteinHits) || data.priorProteinHits < 0) {
    return 0;
  }
  return data.priorProteinHits;
}

export function readReviewReady(data: unknown): boolean {
  return isRecord(data) && data.reviewReady === true;
}

export function readRetentionTail(data: unknown): boolean {
  return isRecord(data) && data.retentionTail === true;
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
