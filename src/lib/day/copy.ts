import { insertEmptyMeals } from "@/lib/day/create";
import {
  assertWritableDayDate,
  DayConflictError,
  MealConflictError,
  previousIsoDate,
  YesterdayMealEmptyError,
  YesterdayMissingError,
} from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-items";
import { getDayByDate } from "@/lib/day/store";
import { filledMealTypes } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";

export async function copyYesterday(
  userId: string,
  date: string,
  replace: boolean,
): Promise<DayWithMeals> {
  assertWritableDayDate(date);
  const yesterday = await getDayByDate(userId, previousIsoDate(date));
  if (!yesterday) {
    throw new YesterdayMissingError();
  }

  const existing = await getDayByDate(userId, date);
  if (existing && !replace) {
    throw new DayConflictError();
  }

  const supabase = createSupabaseServerClient();

  if (existing && replace) {
    const deleted = await supabase
      .from("days")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (deleted.error) {
      throw deleted.error;
    }
  }

  const created = await supabase
    .from("days")
    .insert({
      user_id: userId,
      date,
      is_training_day: yesterday.is_training_day,
      target_protein: yesterday.target_protein,
      target_fat: yesterday.target_fat,
      target_carbs: yesterday.target_carbs,
      notes: yesterday.notes,
    })
    .select("*")
    .single();

  if (created.error) {
    if (created.error.code === "23505") {
      throw new DayConflictError();
    }
    throw created.error;
  }

  const dayId = String(created.data.id);
  const mealIds = await insertEmptyMeals(supabase, userId, dayId);
  const rows = [];

  for (const meal of yesterday.meals) {
    const mealId = mealIds.get(meal.meal_type);
    if (!mealId) {
      continue;
    }

    rows.push(...copyMealItemRows(userId, mealId, meal.items));
  }

  if (rows.length > 0) {
    const insertedItems = await supabase.from("meal_items").insert(rows);
    if (insertedItems.error) {
      throw insertedItems.error;
    }
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function copyMealFromYesterday(
  userId: string,
  mealId: string,
  replace: boolean,
): Promise<DayWithMeals> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  assertWritableDayDate(date);

  const [today, yesterday] = await Promise.all([
    getDayByDate(userId, date),
    getDayByDate(userId, previousIsoDate(date)),
  ]);

  if (!today) {
    throw new Error("Meal not found");
  }

  const target = today.meals.find((meal) => meal.id === mealId);
  if (!target) {
    throw new Error("Meal not found");
  }

  if (!yesterday) {
    throw new YesterdayMissingError();
  }

  const source = yesterday.meals.find(
    (meal) => meal.meal_type === target.meal_type,
  );
  if (!source || source.items.length === 0) {
    throw new YesterdayMealEmptyError();
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

  const inserted = await supabase
    .from("meal_items")
    .insert(copyMealItemRows(userId, mealId, source.items));

  if (inserted.error) {
    throw inserted.error;
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function yesterdayCopyHint(
  userId: string,
  date: string,
): Promise<{ exists: boolean; mealTypes: MealType[] }> {
  const yesterday = await getDayByDate(userId, previousIsoDate(date));
  if (!yesterday) {
    return { exists: false, mealTypes: [] };
  }

  return {
    exists: true,
    mealTypes: filledMealTypes(yesterday.meals),
  };
}

function copyMealItemRows(
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
