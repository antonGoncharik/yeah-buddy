import { mapMealItem } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { buildMealItemRow } from "@/lib/day/meal-item-row";
import { assertUserDayWritable } from "@/lib/day/writable";
import { getFood } from "@/lib/food/list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food, MealItem } from "@/lib/types";

export async function addMealItem(
  userId: string,
  mealId: string,
  foodId: string,
  grams: number,
): Promise<MealItem> {
  const food = await getFood(userId, foodId);
  if (!food) {
    throw new Error("Food not found");
  }

  const items = await addMealItems(userId, mealId, [{ food, grams }]);
  const item = items[0];
  if (!item) {
    throw new Error("Meal item insert failed");
  }
  return item;
}

export async function addMealItems(
  userId: string,
  mealId: string,
  entries: Array<{ food: Food; grams: number }>,
): Promise<MealItem[]> {
  if (entries.length === 0) {
    throw new Error("Meal items empty");
  }

  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  await assertUserDayWritable(userId, date);

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("meal_items")
    .insert(
      entries.map((entry) =>
        buildMealItemRow({
          userId,
          mealId,
          foodId: entry.food.id,
          name: entry.food.name,
          grams: entry.grams,
          per100: {
            protein: entry.food.protein_per_100,
            fat: entry.food.fat_per_100,
            carbs: entry.food.carbs_per_100,
            kcal: entry.food.kcal_per_100,
          },
        }),
      ),
    )
    .select("*");

  if (inserted.error) {
    throw inserted.error;
  }

  return (inserted.data ?? []).map((row) =>
    mapMealItem(row as Record<string, unknown>),
  );
}
