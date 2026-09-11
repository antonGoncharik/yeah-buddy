import {
  mapNamedMeal,
  mapNamedMealHint,
  mapNamedMealItem,
} from "@/lib/named-meal/map";
import { NAMED_MEAL_LIMIT } from "@/lib/named-meal/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NamedMeal, NamedMealDetail, NamedMealHint } from "@/lib/types";

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

export async function getNamedMealDetail(
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

export async function findNamedMealByName(
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
