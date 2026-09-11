import { MealConflictError } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { NamedMealNotFoundError } from "@/lib/named-meal/errors";
import { getNamedMealDetail } from "@/lib/named-meal/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyNamedMeal(
  userId: string,
  mealId: string,
  namedMealId: string,
  replace: boolean,
): Promise<DayWithMeals> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  await assertUserDayWritable(userId, date);

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Meal not found");
  }
  const target = day.meals.find((meal) => meal.id === mealId);
  if (!target) {
    throw new Error("Meal not found");
  }

  const source = await getNamedMealDetail(userId, namedMealId);
  if (!source || source.items.length === 0) {
    throw new NamedMealNotFoundError();
  }

  if (target.items.length > 0 && !replace) {
    throw new MealConflictError();
  }

  const supabase = createSupabaseServerClient();
  if (target.items.length > 0) {
    const deleted = await supabase
      .from("meal_items")
      .delete()
      .eq("meal_id", mealId)
      .eq("user_id", userId);
    if (deleted.error) {
      throw deleted.error;
    }
  }

  const inserted = await supabase.from("meal_items").insert(
    source.items.map((item) => ({
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
    })),
  );
  if (inserted.error) {
    throw inserted.error;
  }

  const next = await getDayByDate(userId, date);
  if (!next) {
    throw new Error("Day lookup failed");
  }
  return next;
}
