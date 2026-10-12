import { isLumpMealItem } from "@/lib/day/lump";
import type { MealItem } from "@/lib/types";

export function mealItemRestoreBody(
  item: MealItem,
): { foodId: string; grams: number } | Record<string, number | string> | null {
  if (isLumpMealItem(item)) {
    return {
      name: item.name_snapshot,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
    };
  }
  if (!item.food_id) {
    return null;
  }
  return { foodId: item.food_id, grams: item.grams };
}
