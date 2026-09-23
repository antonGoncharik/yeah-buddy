import type { SupabaseClient } from "@supabase/supabase-js";

import { STARTER_FOODS } from "@/lib/food/starter";

export function foodNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export const STARTER_FOOD_NAME_KEYS = new Set(
  STARTER_FOODS.map((food) => foodNameKey(food.name)),
);

export interface DedupeFoodCandidate {
  id: string;
  name: string;
  is_favorite: boolean;
  created_at: string;
  in_template: boolean;
  in_meal: boolean;
  in_named_meal: boolean;
}

/** Keep one row when starter catalog foods were inserted twice. */
export function pickFoodKeeper(
  candidates: DedupeFoodCandidate[],
): DedupeFoodCandidate {
  if (candidates.length === 0) {
    throw new Error("No food candidates to keep");
  }

  const ranked = [...candidates].sort((a, b) => {
    if (a.in_template !== b.in_template) {
      return a.in_template ? -1 : 1;
    }
    if (a.in_meal !== b.in_meal) {
      return a.in_meal ? -1 : 1;
    }
    if (a.in_named_meal !== b.in_named_meal) {
      return a.in_named_meal ? -1 : 1;
    }
    if (a.is_favorite !== b.is_favorite) {
      return a.is_favorite ? -1 : 1;
    }
    const byCreated = a.created_at.localeCompare(b.created_at);
    if (byCreated !== 0) {
      return byCreated;
    }
    return a.id.localeCompare(b.id);
  });

  const keeper = ranked[0];
  if (!keeper) {
    throw new Error("No food candidates to keep");
  }
  return keeper;
}

/**
 * Collapse duplicate starter-catalog foods for one user.
 * Only full starter names — not unrelated customs that happen to share a word.
 */
export async function dedupeStarterFoods(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const listed = await supabase
    .from("foods")
    .select("id, name, is_favorite, created_at")
    .eq("user_id", userId);

  if (listed.error) {
    throw listed.error;
  }

  const rows = (listed.data ?? []).filter(
    (
      row,
    ): row is {
      id: string;
      name: string;
      is_favorite: boolean;
      created_at: string;
    } =>
      typeof row.id === "string" &&
      typeof row.name === "string" &&
      typeof row.created_at === "string" &&
      typeof row.is_favorite === "boolean" &&
      STARTER_FOOD_NAME_KEYS.has(foodNameKey(row.name)),
  );

  const byKey = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = foodNameKey(row.name);
    const group = byKey.get(key) ?? [];
    group.push(row);
    byKey.set(key, group);
  }

  const duplicateGroups = [...byKey.values()].filter(
    (group) => group.length > 1,
  );
  if (duplicateGroups.length === 0) {
    return;
  }

  const allIds = duplicateGroups.flatMap((group) => group.map((row) => row.id));
  const [templateIds, mealIds, namedMealIds] = await Promise.all([
    foodIdsInTable(supabase, userId, "meal_template_items", allIds),
    foodIdsInTable(supabase, userId, "meal_items", allIds),
    foodIdsInTable(supabase, userId, "named_meal_items", allIds),
  ]);

  for (const group of duplicateGroups) {
    const keeper = pickFoodKeeper(
      group.map((row) => ({
        id: row.id,
        name: row.name,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
        in_template: templateIds.has(row.id),
        in_meal: mealIds.has(row.id),
        in_named_meal: namedMealIds.has(row.id),
      })),
    );
    const losers = group.map((row) => row.id).filter((id) => id !== keeper.id);
    await mergeFoodDuplicates(supabase, userId, keeper.id, losers);
  }
}

async function foodIdsInTable(
  supabase: SupabaseClient,
  userId: string,
  table: "meal_template_items" | "meal_items" | "named_meal_items",
  foodIds: string[],
): Promise<Set<string>> {
  if (foodIds.length === 0) {
    return new Set();
  }
  const result = await supabase
    .from(table)
    .select("food_id")
    .eq("user_id", userId)
    .in("food_id", foodIds);
  if (result.error) {
    throw result.error;
  }
  return new Set(
    (result.data ?? [])
      .map((row) => row.food_id)
      .filter((id): id is string => typeof id === "string"),
  );
}

async function mergeFoodDuplicates(
  supabase: SupabaseClient,
  userId: string,
  keeperId: string,
  loserIds: string[],
): Promise<void> {
  for (const loserId of loserIds) {
    await rempointTemplateItems(supabase, userId, keeperId, loserId);

    const mealItems = await supabase
      .from("meal_items")
      .update({ food_id: keeperId })
      .eq("user_id", userId)
      .eq("food_id", loserId);
    if (mealItems.error) {
      throw mealItems.error;
    }

    const namedItems = await supabase
      .from("named_meal_items")
      .update({ food_id: keeperId })
      .eq("user_id", userId)
      .eq("food_id", loserId);
    if (namedItems.error) {
      throw namedItems.error;
    }

    const removed = await supabase
      .from("foods")
      .delete()
      .eq("user_id", userId)
      .eq("id", loserId);
    if (removed.error) {
      throw removed.error;
    }
  }
}

async function rempointTemplateItems(
  supabase: SupabaseClient,
  userId: string,
  keeperId: string,
  loserId: string,
): Promise<void> {
  const loserRows = await supabase
    .from("meal_template_items")
    .select("id, template_id, meal_type")
    .eq("user_id", userId)
    .eq("food_id", loserId);
  if (loserRows.error) {
    throw loserRows.error;
  }

  for (const row of loserRows.data ?? []) {
    if (
      typeof row.id !== "string" ||
      typeof row.template_id !== "string" ||
      typeof row.meal_type !== "string"
    ) {
      continue;
    }

    const conflict = await supabase
      .from("meal_template_items")
      .select("id")
      .eq("user_id", userId)
      .eq("food_id", keeperId)
      .eq("template_id", row.template_id)
      .eq("meal_type", row.meal_type)
      .limit(1)
      .maybeSingle();
    if (conflict.error) {
      throw conflict.error;
    }

    if (conflict.data) {
      const dropped = await supabase
        .from("meal_template_items")
        .delete()
        .eq("user_id", userId)
        .eq("id", row.id);
      if (dropped.error) {
        throw dropped.error;
      }
      continue;
    }

    const moved = await supabase
      .from("meal_template_items")
      .update({ food_id: keeperId })
      .eq("user_id", userId)
      .eq("id", row.id);
    if (moved.error) {
      throw moved.error;
    }
  }
}
