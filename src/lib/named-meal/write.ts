import { getDateForMeal } from "@/lib/day/meal-date";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import {
  NamedMealEmptyError,
  NamedMealLimitError,
} from "@/lib/named-meal/errors";
import { mapNamedMeal } from "@/lib/named-meal/map";
import { findNamedMealByName, listNamedMealHints } from "@/lib/named-meal/read";
import { NAMED_MEAL_LIMIT } from "@/lib/named-meal/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NamedMeal, NamedMealHint } from "@/lib/types";

export async function saveNamedMealFromMeal(
  userId: string,
  mealId: string,
  name: string,
): Promise<NamedMealHint> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  await assertUserDayWritable(userId, date);

  const day = await getDayByDate(userId, date);
  const meal = day?.meals.find((entry) => entry.id === mealId);
  if (!meal) {
    throw new Error("Meal not found");
  }
  if (meal.items.length === 0) {
    throw new NamedMealEmptyError();
  }

  const supabase = createSupabaseServerClient();
  const existing = await findNamedMealByName(userId, name);

  if (!existing) {
    const hints = await listNamedMealHints(userId);
    if (hints.length >= NAMED_MEAL_LIMIT) {
      throw new NamedMealLimitError();
    }
  }

  let namedMeal: NamedMeal;
  if (existing) {
    const updated = await supabase
      .from("named_meals")
      .update({ meal_type: meal.meal_type })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (updated.error || !updated.data) {
      throw updated.error ?? new Error("Named meal update failed");
    }
    namedMeal = mapNamedMeal(updated.data as Record<string, unknown>);

    const deleted = await supabase
      .from("named_meal_items")
      .delete()
      .eq("named_meal_id", namedMeal.id)
      .eq("user_id", userId);
    if (deleted.error) {
      throw deleted.error;
    }
  } else {
    const created = await supabase
      .from("named_meals")
      .insert({
        user_id: userId,
        name,
        meal_type: meal.meal_type,
      })
      .select("*")
      .single();
    if (created.error || !created.data) {
      throw created.error ?? new Error("Named meal insert failed");
    }
    namedMeal = mapNamedMeal(created.data as Record<string, unknown>);
  }

  const inserted = await supabase.from("named_meal_items").insert(
    meal.items.map((item, index) => ({
      user_id: userId,
      named_meal_id: namedMeal.id,
      food_id: item.food_id,
      name_snapshot: item.name_snapshot,
      grams: item.grams,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      kcal: item.kcal,
      per_100_snapshot: item.per_100_snapshot,
      sort_order: index,
    })),
  );
  if (inserted.error) {
    throw inserted.error;
  }

  return {
    id: namedMeal.id,
    name: namedMeal.name,
    meal_type: namedMeal.meal_type,
  };
}

export async function deleteNamedMeal(
  userId: string,
  id: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("named_meals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    throw deleted.error;
  }

  return Boolean(deleted.data);
}
