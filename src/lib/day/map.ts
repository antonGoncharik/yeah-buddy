import { isMealType, type Macros } from "@/lib/nutrition";
import { isRecord, toNullableString, toNumber } from "@/lib/read";
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
    date: String(row.date),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
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
      if (!meal || typeof meal !== "object" || !("meal_items" in meal)) {
        continue;
      }
      const items = (meal as { meal_items: unknown }).meal_items;
      if (!Array.isArray(items)) {
        continue;
      }
      for (const item of items) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const macros = item as Record<string, unknown>;
        protein += toNumber(macros.protein);
        fat += toNumber(macros.fat);
        carbs += toNumber(macros.carbs);
        kcal += toNumber(macros.kcal);
      }
    }
  }

  return {
    date: String(row.date).slice(0, 10),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    fact_protein: protein,
    fact_fat: fat,
    fact_carbs: carbs,
    fact_kcal: kcal,
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
  const items = Array.isArray(row.meal_items)
    ? row.meal_items
        .map((item) => mapMealItem(item as Record<string, unknown>))
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
    : [];

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
