import { copyMealItemRows } from "@/lib/day/copy-rows";
import { insertEmptyMeals } from "@/lib/day/create";
import {
  DayConflictError,
  MealConflictError,
  previousIsoDate,
  SourceDayMissingError,
  SourceMealEmptyError,
  YesterdayMealEmptyError,
  YesterdayMissingError,
} from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { listCopyDays, yesterdayCopyHint } from "@/lib/day/copy-hints";
export { copyMealItemRows } from "@/lib/day/copy-rows";

export async function copyYesterday(
  userId: string,
  date: string,
  replace: boolean,
): Promise<DayWithMeals> {
  await assertUserDayWritable(userId, date);
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

  return copyMealFromDate(userId, mealId, previousIsoDate(date), replace);
}

export async function copyMealFromDate(
  userId: string,
  mealId: string,
  sourceDate: string,
  replace: boolean,
): Promise<DayWithMeals> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  await assertUserDayWritable(userId, date);

  const fromYesterday = sourceDate === previousIsoDate(date);

  const [today, sourceDay] = await Promise.all([
    getDayByDate(userId, date),
    getDayByDate(userId, sourceDate),
  ]);

  if (!today) {
    throw new Error("Meal not found");
  }

  const target = today.meals.find((meal) => meal.id === mealId);
  if (!target) {
    throw new Error("Meal not found");
  }

  if (!sourceDay) {
    throw fromYesterday
      ? new YesterdayMissingError()
      : new SourceDayMissingError();
  }

  const source = sourceDay.meals.find(
    (meal) => meal.meal_type === target.meal_type,
  );
  if (!source || source.items.length === 0) {
    throw fromYesterday
      ? new YesterdayMealEmptyError()
      : new SourceMealEmptyError();
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
