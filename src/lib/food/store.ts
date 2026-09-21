import {
  type FavoriteOfferHit,
  favoriteOfferWindowStart,
} from "@/lib/food/favorite-offer";
import { mapFood } from "@/lib/food/map";
import type { FoodInput, FoodListFilter } from "@/lib/food/schema";
import { isStarterFoodList } from "@/lib/food/starter";
import { isRecord } from "@/lib/read";
import { UNIQUE_VIOLATION } from "@/lib/seed-missing";
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

export async function foodsAreStarterOnly(userId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("foods")
    .select("name, catalog_food_id")
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return isStarterFoodList(
    (result.data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const catalogFoodId = record.catalog_food_id;
      return {
        name: typeof record.name === "string" ? record.name : "",
        catalogFoodId: typeof catalogFoodId === "string" ? catalogFoodId : null,
      };
    }),
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

export async function createFood(
  userId: string,
  input: FoodInput,
): Promise<Food> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("foods")
    .insert({
      user_id: userId,
      ...input,
      state: input.state ?? "as_is",
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === UNIQUE_VIOLATION && input.barcode) {
      const existing = await supabase
        .from("foods")
        .select("*")
        .eq("user_id", userId)
        .eq("barcode", input.barcode)
        .maybeSingle();
      if (existing.error) {
        throw existing.error;
      }
      if (existing.data) {
        return mapFood(existing.data as Record<string, unknown>);
      }
    }
    throw inserted.error ?? new Error("Food insert failed");
  }

  return mapFood(inserted.data as Record<string, unknown>);
}

export async function updateFood(
  userId: string,
  id: string,
  input: FoodInput,
): Promise<Food | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("foods")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return mapFood(updated.data as Record<string, unknown>);
}

export async function deleteFood(userId: string, id: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("foods")
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

export async function setFoodFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<Food | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("foods")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return mapFood(updated.data as Record<string, unknown>);
}

export async function listFavoriteOfferHits(
  userId: string,
  today: string,
): Promise<FavoriteOfferHit[]> {
  const start = favoriteOfferWindowStart(today);
  const supabase = createSupabaseServerClient();
  const days = await supabase
    .from("days")
    .select(
      `
      date,
      meals (
        meal_items (
          food_id
        )
      )
    `,
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", today);

  if (days.error) {
    throw days.error;
  }

  const foodIds = new Set<string>();
  const logged: Array<{ date: string; foodId: string }> = [];
  for (const row of days.data ?? []) {
    const date = String(row.date).slice(0, 10);
    for (const foodId of foodIdsFromDayRow(row as Record<string, unknown>)) {
      foodIds.add(foodId);
      logged.push({ date, foodId });
    }
  }

  if (foodIds.size === 0) {
    return [];
  }

  const foods = await supabase
    .from("foods")
    .select("id, name, is_favorite")
    .eq("user_id", userId)
    .in("id", [...foodIds]);

  if (foods.error) {
    throw foods.error;
  }

  const byId = new Map(
    (foods.data ?? []).flatMap((row) => {
      if (typeof row.id !== "string" || typeof row.name !== "string") {
        return [];
      }
      return [
        [
          row.id,
          { name: row.name, isFavorite: Boolean(row.is_favorite) },
        ] as const,
      ];
    }),
  );

  return logged.flatMap((item) => {
    const food = byId.get(item.foodId);
    if (!food) {
      return [];
    }
    return [
      {
        foodId: item.foodId,
        name: food.name,
        isFavorite: food.isFavorite,
        date: item.date,
      },
    ];
  });
}

function foodIdsFromDayRow(row: Record<string, unknown>): string[] {
  const meals = Array.isArray(row.meals) ? row.meals : [];
  const ids: string[] = [];
  for (const meal of meals) {
    if (!isRecord(meal) || !Array.isArray(meal.meal_items)) {
      continue;
    }
    for (const item of meal.meal_items) {
      if (!isRecord(item) || typeof item.food_id !== "string") {
        continue;
      }
      if (item.food_id !== "") {
        ids.push(item.food_id);
      }
    }
  }
  return ids;
}
