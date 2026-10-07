import { isIsoDate, previousIsoDate } from "@/lib/day/dates";
import { formatKcal } from "@/lib/nutrition/macros";
import type { DayType, MealType } from "@/lib/types";

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

const REPEAT_YESTERDAY_MEAL: Record<MealType, string> = {
  breakfast: "Как вчера утром",
  lunch: "Как вчера в обед",
  snack: "Как вчера полдник",
  pre_workout: "Как вчера до зала",
  post_workout: "Как вчера после зала",
  dinner: "Как вчера вечером",
};

export function getMealLabel(mealType: MealType): string {
  return MEAL_LABELS[mealType];
}

export function repeatYesterdayMealLabel(mealType: MealType): string {
  return REPEAT_YESTERDAY_MEAL[mealType];
}

/** Yesterday's date when that slot already has food. Empty meals use it for one tap. */
export function yesterdayMealSource(
  date: string,
  mealType: MealType,
  copyDays: ReadonlyArray<{ date: string; mealTypes: readonly MealType[] }>,
): string | null {
  if (!isIsoDate(date)) {
    return null;
  }
  const yesterday = previousIsoDate(date);
  const hit = copyDays.some(
    (day) => day.date === yesterday && day.mealTypes.includes(mealType),
  );
  return hit ? yesterday : null;
}

export function mealExistsReplace(mealType: MealType): string {
  return `Заменить ${MEAL_LABELS[mealType].toLowerCase()}?`;
}

export function shareMealLine(_mealType?: MealType): string {
  return "Поделиться";
}

export function filledMealTypes(
  meals: Array<{ meal_type: MealType; items: readonly unknown[] }>,
): MealType[] {
  return meals
    .filter((meal) => meal.items.length > 0)
    .map((meal) => meal.meal_type);
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

export function hiddenMealSlotsNote(
  kcal: number,
  mealTypes: MealType[],
  isTrainingDay: boolean,
): string | null {
  if (!(kcal > 0) || mealTypes.length === 0) {
    return null;
  }

  const kcalText = formatKcal(kcal);
  if (mealTypes.length === 1 && mealTypes[0] === "snack") {
    return `Ещё ${kcalText} ккал в полднике. В день тренировки этот приём скрыт.`;
  }

  const names = mealTypes.map((type) => getMealLabel(type).toLowerCase());
  const where = isTrainingDay ? "В день тренировки" : "В день отдыха";
  if (names.length === 1) {
    return `Ещё ${kcalText} ккал (${names[0]}). ${where} этот приём скрыт.`;
  }

  return `Ещё ${kcalText} ккал (${names.join(", ")}). На этом дне эти приёмы скрыты.`;
}

export function visibleMealTypes(isTrainingDay: boolean): MealType[] {
  return MEAL_DISPLAY_ORDER.filter((mealType) =>
    isMealVisible(mealType, isTrainingDay),
  );
}

export function isMealType(value: unknown): value is MealType {
  return (
    value === "breakfast" ||
    value === "lunch" ||
    value === "snack" ||
    value === "pre_workout" ||
    value === "post_workout" ||
    value === "dinner"
  );
}

export function isDayType(value: unknown): value is DayType {
  return value === "rest" || value === "training";
}
