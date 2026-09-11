import type { DayWithMeals } from "@/lib/day/map";

export function copyMealItemRows(
  userId: string,
  mealId: string,
  items: DayWithMeals["meals"][number]["items"],
) {
  return items.map((item) => ({
    user_id: userId,
    meal_id: mealId,
    food_id: item.food_id,
    name_snapshot: item.name_snapshot,
    grams: item.grams,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
    kcal: item.kcal,
    per_100_snapshot: item.per_100_snapshot,
  }));
}
