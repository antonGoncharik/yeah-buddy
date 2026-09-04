import type { MealType } from "@/lib/types";

export type Macros = {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

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
  pre_workout: "Предтрен",
  post_workout: "Посттрен",
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
