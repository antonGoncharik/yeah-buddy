import {
  calcMacrosFromPer100,
  isDayType,
  isMealType,
  roundMacros,
} from "@/lib/nutrition";
import { toNumber } from "@/lib/read";
import type {
  Food,
  MealTemplate,
  MealTemplateItem,
  MealTemplateItemView,
} from "@/lib/types";

export function toItemView(
  row: MealTemplateItem,
  food: Food,
): MealTemplateItemView {
  const macros = roundMacros(
    calcMacrosFromPer100(
      {
        protein: food.protein_per_100,
        fat: food.fat_per_100,
        carbs: food.carbs_per_100,
        kcal: food.kcal_per_100,
      },
      row.grams,
    ),
  );

  return {
    ...row,
    food,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}

export function mapMealTemplate(row: Record<string, unknown>): MealTemplate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    day_type: isDayType(row.day_type) ? row.day_type : "rest",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapTemplateItemRow(
  row: Record<string, unknown>,
): MealTemplateItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    template_id: String(row.template_id),
    meal_type: isMealType(row.meal_type) ? row.meal_type : "snack",
    food_id: String(row.food_id),
    grams: toNumber(row.grams),
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
  };
}
