import { isMealType, type Macros } from "@/lib/nutrition";
import { isRecord, toNullableString, toNumber } from "@/lib/read";
import type {
  MealType,
  NamedMeal,
  NamedMealHint,
  NamedMealItem,
} from "@/lib/types";

export function mapNamedMeal(row: Record<string, unknown>): NamedMeal {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    meal_type: isMealType(row.meal_type) ? row.meal_type : "breakfast",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapNamedMealHint(row: Record<string, unknown>): NamedMealHint {
  const meal = mapNamedMeal(row);
  return {
    id: meal.id,
    name: meal.name,
    meal_type: meal.meal_type,
  };
}

export function mapNamedMealItem(row: Record<string, unknown>): NamedMealItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    named_meal_id: String(row.named_meal_id),
    food_id: toNullableString(row.food_id),
    name_snapshot: String(row.name_snapshot),
    grams: toNumber(row.grams),
    protein: toNumber(row.protein),
    fat: toNumber(row.fat),
    carbs: toNumber(row.carbs),
    kcal: toNumber(row.kcal),
    per_100_snapshot: mapPer100(row.per_100_snapshot),
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
  };
}

export function namedMealsOfType(
  meals: NamedMealHint[],
  mealType: MealType,
): NamedMealHint[] {
  return meals.filter((meal) => meal.meal_type === mealType);
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
