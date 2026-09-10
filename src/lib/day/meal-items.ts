import { assertWritableDayDate } from "@/lib/day/dates";
import { mapMealItem } from "@/lib/day/map";
import { getFood } from "@/lib/food/store";
import {
  calcMacrosFromPer100,
  type Macros,
  roundMacros,
} from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealItem } from "@/lib/types";

export async function getDateForMeal(
  userId: string,
  mealId: string,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("day_id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    return null;
  }

  const day = await supabase
    .from("days")
    .select("date")
    .eq("id", meal.data.day_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (day.error) {
    throw day.error;
  }

  if (!day.data) {
    return null;
  }

  return String(day.data.date).slice(0, 10);
}

export async function addMealItem(
  userId: string,
  mealId: string,
  foodId: string,
  grams: number,
): Promise<MealItem> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  assertWritableDayDate(date);

  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    throw new Error("Meal not found");
  }

  const food = await getFood(userId, foodId);
  if (!food) {
    throw new Error("Food not found");
  }

  const inserted = await supabase
    .from("meal_items")
    .insert(
      buildMealItemRow({
        userId,
        mealId,
        foodId: food.id,
        name: food.name,
        grams,
        per100: {
          protein: food.protein_per_100,
          fat: food.fat_per_100,
          carbs: food.carbs_per_100,
          kcal: food.kcal_per_100,
        },
      }),
    )
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Meal item insert failed");
  }

  return mapMealItem(inserted.data as Record<string, unknown>);
}

export async function getMealItem(
  userId: string,
  itemId: string,
): Promise<MealItem | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("meal_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapMealItem(result.data as Record<string, unknown>);
}

export async function updateMealItemGrams(
  userId: string,
  itemId: string,
  grams: number,
): Promise<MealItem> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    throw new Error("Meal item not found");
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    throw new Error("Meal item not found");
  }
  assertWritableDayDate(date);

  const macros = roundMacros(
    calcMacrosFromPer100(item.per_100_snapshot, grams),
  );
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("meal_items")
    .update({
      grams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Meal item not found");
  }

  return mapMealItem(updated.data as Record<string, unknown>);
}

export async function deleteMealItem(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    return false;
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    return false;
  }
  assertWritableDayDate(date);

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("meal_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    throw deleted.error;
  }

  return Boolean(deleted.data);
}

export function buildMealItemRow({
  userId,
  mealId,
  foodId,
  name,
  grams,
  per100,
}: {
  userId: string;
  mealId: string;
  foodId: string;
  name: string;
  grams: number;
  per100: Macros;
}) {
  const macros = roundMacros(calcMacrosFromPer100(per100, grams));

  return {
    user_id: userId,
    meal_id: mealId,
    food_id: foodId,
    name_snapshot: name,
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: per100,
  };
}
