import { isIsoDate, isWritableDayDate } from "@/lib/day/dates";
import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import type { RecipeLine } from "@/lib/day/remaining";
import {
  DEFAULT_REST_MACRO_GOALS,
  DEFAULT_TRAINING_MACRO_GOALS,
  isMealType,
  isOnboardingGoal,
} from "@/lib/nutrition";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import { parseGymEnabled } from "@/lib/settings/gym-mode";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNumber,
} from "@/lib/read";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";
import type {
  CopyDayHint,
  MealType,
  NamedMealHint,
  UserGoal,
} from "@/lib/types";

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

export function readLastBodyWeightDate(data: unknown): string | null {
  if (!isRecord(data) || typeof data.lastBodyWeightDate !== "string") {
    return null;
  }
  return isIsoDate(data.lastBodyWeightDate) ? data.lastBodyWeightDate : null;
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

export function readUserGoal(data: unknown): UserGoal | null {
  if (!isRecord(data) || !isOnboardingGoal(data.goal)) {
    return null;
  }
  return data.goal;
}

export function readWeightSteady(data: unknown): boolean {
  return isRecord(data) && data.weightSteady === true;
}

export function readPriorFoodLogDays(data: unknown): number {
  if (!isRecord(data) || typeof data.priorFoodLogDays !== "number") {
    return 0;
  }
  if (!Number.isInteger(data.priorFoodLogDays) || data.priorFoodLogDays < 0) {
    return 0;
  }
  return data.priorFoodLogDays;
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

export function readGymEnabled(data: unknown): boolean {
  if (!isRecord(data)) {
    return true;
  }
  return parseGymEnabled(data.gymEnabled);
}

export function readReviewReady(data: unknown): boolean {
  if (!readGymEnabled(data)) {
    return false;
  }
  return isRecord(data) && data.reviewReady === true;
}

export function readRetentionTail(data: unknown): boolean {
  return isRecord(data) && data.retentionTail === true;
}

export function readEarlyHabit(data: unknown): boolean {
  return isRecord(data) && data.earlyHabit === true;
}

export function readHabitBridge(data: unknown): boolean {
  return isRecord(data) && data.habitBridge === true;
}

export function readEnergyGoal(data: unknown): EnergyGoalOffer | null {
  if (!isRecord(data) || !isRecord(data.energyGoal)) {
    return null;
  }
  const row = data.energyGoal;
  if (!isOnboardingGoal(row.goal)) {
    return null;
  }
  const expenditure = toNumber(row.expenditure);
  const restKcal = toNumber(row.restKcal);
  if (
    !(expenditure > 0) ||
    !(restKcal > 0) ||
    typeof row.delta !== "number" ||
    typeof row.span !== "number" ||
    !Number.isInteger(row.span) ||
    row.span < 1
  ) {
    return null;
  }
  return {
    expenditure,
    restKcal,
    goal: row.goal,
    delta: row.delta,
    span: row.span,
  };
}

export function readMealTemplateFillPromptDismissed(data: unknown): boolean {
  return isRecord(data) && data.mealTemplateFillPromptDismissed === true;
}

export function readHabitBridgeSnapshot(
  data: unknown,
): HabitBridgeSnapshot | null {
  if (!isRecord(data) || !isRecord(data.habitBridgeSnapshot)) {
    return null;
  }
  const row = data.habitBridgeSnapshot;
  if (
    typeof row.foodDaysWeek !== "number" ||
    typeof row.gymSessionsWeek !== "number" ||
    typeof row.proteinHitDaysWeek !== "number" ||
    typeof row.reviewReady !== "boolean"
  ) {
    return null;
  }
  return {
    foodDaysWeek: row.foodDaysWeek,
    gymSessionsWeek: row.gymSessionsWeek,
    proteinHitDaysWeek: row.proteinHitDaysWeek,
    reviewReady: row.reviewReady,
  };
}

export function readEarlyHabitSnapshot(
  data: unknown,
): EarlyHabitSnapshot | null {
  if (!isRecord(data) || !isRecord(data.earlyHabitSnapshot)) {
    return null;
  }
  const row = data.earlyHabitSnapshot;
  if (
    typeof row.foodLogStreak !== "number" ||
    typeof row.foodAtRisk !== "boolean" ||
    typeof row.proteinHits !== "number" ||
    typeof row.gymSessionsWeek !== "number" ||
    typeof row.dayOfHabit !== "number"
  ) {
    return null;
  }
  return {
    foodLogStreak: row.foodLogStreak,
    foodAtRisk: row.foodAtRisk,
    proteinHits: row.proteinHits,
    proteinLine: typeof row.proteinLine === "string" ? row.proteinLine : null,
    gymSessionsWeek: row.gymSessionsWeek,
    dayOfHabit: row.dayOfHabit,
  };
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
