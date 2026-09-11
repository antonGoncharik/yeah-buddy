import { MealConflictError } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-items";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import {
  NAMED_MEAL_EMPTY,
  NAMED_MEAL_LIMIT as NAMED_MEAL_LIMIT_MSG,
} from "@/lib/messages";
import {
  mapNamedMeal,
  mapNamedMealHint,
  mapNamedMealItem,
} from "@/lib/named-meal/map";
import { NAMED_MEAL_LIMIT } from "@/lib/named-meal/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NamedMeal, NamedMealDetail, NamedMealHint } from "@/lib/types";

export class NamedMealEmptyError extends Error {
  constructor() {
    super(NAMED_MEAL_EMPTY);
  }
}

export class NamedMealLimitError extends Error {
  constructor() {
    super(NAMED_MEAL_LIMIT_MSG);
  }
}

export class NamedMealNotFoundError extends Error {
  constructor() {
    super("Сохранённый приём не найден.");
  }
}

export async function listNamedMealHints(
  userId: string,
): Promise<NamedMealHint[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("named_meals")
    .select("id, user_id, name, meal_type, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapNamedMealHint(row as Record<string, unknown>),
  );
}

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

async function getNamedMealDetail(
  userId: string,
  id: string,
): Promise<NamedMealDetail | null> {
  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("named_meals")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (meal.error) {
    throw meal.error;
  }
  if (!meal.data) {
    return null;
  }

  const items = await supabase
    .from("named_meal_items")
    .select("*")
    .eq("named_meal_id", id)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (items.error) {
    throw items.error;
  }

  return {
    ...mapNamedMeal(meal.data as Record<string, unknown>),
    items: (items.data ?? []).map((row) =>
      mapNamedMealItem(row as Record<string, unknown>),
    ),
  };
}

async function findNamedMealByName(
  userId: string,
  name: string,
): Promise<NamedMeal | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("named_meals")
    .select("*")
    .eq("user_id", userId)
    .limit(NAMED_MEAL_LIMIT);

  if (result.error) {
    throw result.error;
  }

  const needle = name.toLowerCase();
  const match = (result.data ?? []).find(
    (row) => String(row.name).toLowerCase() === needle,
  );
  return match ? mapNamedMeal(match as Record<string, unknown>) : null;
}
