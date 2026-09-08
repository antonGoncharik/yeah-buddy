import type { DayType, MealType, UserSettings } from "@/lib/types";

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  rest: "Отдых",
  training: "Тренировка",
};

export const DAY_TEMPLATE_TITLES: Record<DayType, string> = {
  rest: "День отдыха",
  training: "День тренировки",
};

export type Macros = {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

export const DEFAULT_REST_MACRO_GOALS = {
  protein: 120,
  fat: 70,
  carbs: 200,
} as const;

export const DEFAULT_TRAINING_MACRO_GOALS = {
  protein: 120,
  fat: 70,
  carbs: 250,
} as const;

export function defaultMacroGoals(dayType: DayType): Macros {
  const goals =
    dayType === "training"
      ? DEFAULT_TRAINING_MACRO_GOALS
      : DEFAULT_REST_MACRO_GOALS;
  return {
    protein: goals.protein,
    fat: goals.fat,
    carbs: goals.carbs,
    kcal: calcKcalFromMacros(goals.protein, goals.fat, goals.carbs),
  };
}

export function macroGoalsFromProtein(
  protein: number,
  current?: Pick<
    UserSettings,
    "rest_fat" | "rest_carbs" | "training_fat" | "training_carbs"
  >,
): { rest: Macros; training: Macros } {
  const restFat = current?.rest_fat ?? DEFAULT_REST_MACRO_GOALS.fat;
  const restCarbs = current?.rest_carbs ?? DEFAULT_REST_MACRO_GOALS.carbs;
  const trainingFat = current?.training_fat ?? DEFAULT_TRAINING_MACRO_GOALS.fat;
  const trainingCarbs =
    current?.training_carbs ?? DEFAULT_TRAINING_MACRO_GOALS.carbs;

  return {
    rest: {
      protein,
      fat: restFat,
      carbs: restCarbs,
      kcal: calcKcalFromMacros(protein, restFat, restCarbs),
    },
    training: {
      protein,
      fat: trainingFat,
      carbs: trainingCarbs,
      kcal: calcKcalFromMacros(protein, trainingFat, trainingCarbs),
    },
  };
}

export const MEAL_DISPLAY_ORDER: MealType[] = [
  "breakfast",
  "lunch",
  "snack",
  "pre_workout",
  "post_workout",
  "dinner",
];

const MEAL_ORDER: Record<MealType, number> = {
  breakfast: 10,
  lunch: 20,
  snack: 30,
  pre_workout: 40,
  post_workout: 50,
  dinner: 60,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  snack: "Полдник",
  pre_workout: "До тренировки",
  post_workout: "После тренировки",
  dinner: "Ужин",
};

export function calcKcalFromMacros(
  protein: number,
  fat: number,
  carbs: number,
): number {
  return protein * 4 + fat * 9 + carbs * 4;
}

export function calcMacrosFromPer100(per100: Macros, grams: number): Macros {
  return {
    protein: (per100.protein * grams) / 100,
    fat: (per100.fat * grams) / 100,
    carbs: (per100.carbs * grams) / 100,
    kcal: (per100.kcal * grams) / 100,
  };
}

export function sumMealItems(items: Macros[]): Macros {
  return items.reduce(
    (sum, item) => ({
      protein: sum.protein + item.protein,
      fat: sum.fat + item.fat,
      carbs: sum.carbs + item.carbs,
      kcal: sum.kcal + item.kcal,
    }),
    { protein: 0, fat: 0, carbs: 0, kcal: 0 },
  );
}

export function sumMeals(mealsWithItems: Array<{ items: Macros[] }>): Macros {
  return sumMealItems(mealsWithItems.map((meal) => sumMealItems(meal.items)));
}

export function formatMacro(value: number): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatKcal(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

export function getMealLabel(mealType: MealType): string {
  return MEAL_LABELS[mealType];
}

export function getMealOrder(mealType: MealType): number {
  return MEAL_ORDER[mealType];
}

export function isMealVisible(
  mealType: MealType,
  isTrainingDay: boolean,
): boolean {
  if (isTrainingDay) {
    return mealType !== "snack";
  }

  return mealType !== "pre_workout" && mealType !== "post_workout";
}

export function visibleMealTypes(isTrainingDay: boolean): MealType[] {
  return MEAL_DISPLAY_ORDER.filter((mealType) =>
    isMealVisible(mealType, isTrainingDay),
  );
}

export function isMealType(value: unknown): value is MealType {
  return MEAL_DISPLAY_ORDER.includes(value as MealType);
}

export function isDayType(value: unknown): value is DayType {
  return value === "rest" || value === "training";
}

export function roundMacros(macros: Macros): Macros {
  return {
    protein: round2(macros.protein),
    fat: round2(macros.fat),
    carbs: round2(macros.carbs),
    kcal: round2(macros.kcal),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
