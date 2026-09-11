import { isMealType, type Macros } from "@/lib/nutrition";
import {
  isRecord,
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/read";
import type { Day, DayHistoryRow, Meal, MealItem } from "@/lib/types";

export type DayWithMeals = Day & {
  meals: Array<Meal & { items: MealItem[] }>;
};

export function mapDayWithMeals(row: Record<string, unknown>): DayWithMeals {
  const meals = Array.isArray(row.meals)
    ? row.meals
        .map((meal) => mapMeal(meal as Record<string, unknown>))
        .sort((left, right) => left.sort_order - right.sort_order)
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    date: isoDate(row.date),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    body_weight: toNullableNumber(row.body_weight),
    notes: toNullableString(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    meals,
  };
}

export function mapDayHistoryRow(row: Record<string, unknown>): DayHistoryRow {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let kcal = 0;
  if (Array.isArray(row.meals)) {
    for (const meal of row.meals) {
      if (!isRecord(meal)) {
        continue;
      }
      for (const item of mealItemRows(meal)) {
        protein += toNumber(item.protein);
        fat += toNumber(item.fat);
        carbs += toNumber(item.carbs);
        kcal += toNumber(item.kcal);
      }
    }
  }

  return {
    date: isoDate(row.date),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    body_weight: toNullableNumber(row.body_weight),
    fact_protein: protein,
    fact_fat: fat,
    fact_carbs: carbs,
    fact_kcal: kcal,
  };
}

export function parseDayHistoryPayload(
  row: Record<string, unknown>,
): DayHistoryRow | null {
  if (typeof row.date !== "string") {
    return null;
  }

  return {
    date: row.date,
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    body_weight: toNullableNumber(row.body_weight),
    fact_protein: toNumber(row.fact_protein),
    fact_fat: toNumber(row.fact_fat),
    fact_carbs: toNumber(row.fact_carbs),
    fact_kcal: toNumber(row.fact_kcal),
  };
}

export function mapMealItem(row: Record<string, unknown>): MealItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    meal_id: String(row.meal_id),
    food_id: toNullableString(row.food_id),
    name_snapshot: String(row.name_snapshot),
    grams: toNumber(row.grams),
    protein: toNumber(row.protein),
    fat: toNumber(row.fat),
    carbs: toNumber(row.carbs),
    kcal: toNumber(row.kcal),
    per_100_snapshot: mapPer100(row.per_100_snapshot),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMeal(row: Record<string, unknown>): Meal & { items: MealItem[] } {
  const items = mealItemRows(row)
    .map((item) => mapMealItem(item))
    .sort((left, right) => left.created_at.localeCompare(right.created_at));

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    day_id: String(row.day_id),
    meal_type: isMealType(row.meal_type) ? row.meal_type : "snack",
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
    items,
  };
}

function mealItemRows(row: Record<string, unknown>): Record<string, unknown>[] {
  const raw = Array.isArray(row.meal_items)
    ? row.meal_items
    : Array.isArray(row.items)
      ? row.items
      : [];

  return raw.filter((item): item is Record<string, unknown> => isRecord(item));
}

function isoDate(value: unknown): string {
  return String(value).slice(0, 10);
}

function mapPer100(value: unknown): Macros {
  if (!isRecord(value)) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }

  return {
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
  };
}
