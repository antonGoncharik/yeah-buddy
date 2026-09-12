import { copyMealItemRows } from "@/lib/day/copy-rows";
import {
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
