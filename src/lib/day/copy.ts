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
import { getDateForMeal } from "@/lib/day/meal-items";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { filledMealTypes, isMealType } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CopyDayHint, MealType } from "@/lib/types";

const COPY_DAYS_WINDOW = 14;

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

export async function listCopyDays(
  userId: string,
  beforeDate: string,
): Promise<CopyDayHint[]> {
  const start = shiftIsoDate(beforeDate, -(COPY_DAYS_WINDOW - 1));
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      date,
      meals (
        meal_type,
        meal_items (id)
      )
    `,
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", beforeDate)
    .order("date", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).flatMap((row) => {
    const date = String(row.date).slice(0, 10);
    const meals = Array.isArray(row.meals) ? row.meals : [];
    const mealTypes = meals.flatMap((meal) => {
      if (!meal || typeof meal !== "object") {
        return [];
      }
      const record = meal as { meal_type?: unknown; meal_items?: unknown };
      if (!isMealType(record.meal_type)) {
        return [];
      }
      if (!Array.isArray(record.meal_items) || record.meal_items.length === 0) {
        return [];
      }
      return [record.meal_type];
    });
    if (mealTypes.length === 0) {
      return [];
    }
    return [{ date, mealTypes }];
  });
}

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

function shiftIsoDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}
