import { mapFood } from "@/lib/food/map";
import type { FoodListFilter } from "@/lib/food/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";

export async function listFoods(
  userId: string,
  filter: FoodListFilter = "all",
): Promise<Food[]> {
  if (filter === "recent") {
    return listRecentFoods(userId);
  }

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("foods")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (filter === "favorites") {
    query = query.eq("is_favorite", true);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapFood(row as Record<string, unknown>),
  );
}

export async function getFood(
  userId: string,
  id: string,
): Promise<Food | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("foods")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapFood(result.data as Record<string, unknown>);
}

async function listRecentFoods(userId: string): Promise<Food[]> {
  const supabase = createSupabaseServerClient();
  const items = await supabase
    .from("meal_items")
    .select("food_id, created_at")
    .eq("user_id", userId)
    .not("food_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (items.error) {
    throw items.error;
  }

  const foodIds: string[] = [];
  for (const item of items.data ?? []) {
    if (typeof item.food_id !== "string") {
      continue;
    }
    if (!foodIds.includes(item.food_id)) {
      foodIds.push(item.food_id);
    }
  }

  if (foodIds.length === 0) {
    return [];
  }

  const foods = await supabase
    .from("foods")
    .select("*")
    .eq("user_id", userId)
    .in("id", foodIds);

  if (foods.error) {
    throw foods.error;
  }

  const byId = new Map(
    (foods.data ?? []).map((row) => {
      const food = mapFood(row as Record<string, unknown>);
      return [food.id, food];
    }),
  );

  return foodIds.flatMap((id) => {
    const food = byId.get(id);
    return food ? [food] : [];
  });
}
