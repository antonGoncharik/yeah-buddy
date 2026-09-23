import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dedupeStarterFoods,
  foodNameKey,
} from "@/lib/food/dedupe-foods";
import { FAVORITE_FOODS, STARTER_FOODS } from "@/lib/food/starter";
import {
  seededNames,
  throwUnlessUniqueViolation,
} from "@/lib/seed-missing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureStarterExercises } from "@/lib/workout/seed";

export async function ensureInitialData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User id is required");
  }

  const supabase = createSupabaseServerClient();
  await ensureStarterFoods(supabase, userId);
  await ensureStarterExercises(supabase, userId);
}

async function ensureStarterFoods(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Login can race itself; collapse starter-name copies before inserting.
  await dedupeStarterFoods(supabase, userId);

  const have = await seededNames(supabase, "foods", userId);
  const haveKeys = new Set([...have].map((name) => foodNameKey(name)));
  const missing = STARTER_FOODS.filter(
    (food) => !haveKeys.has(foodNameKey(food.name)),
  );
  if (missing.length === 0) {
    return;
  }

  const inserted = await supabase.from("foods").insert(
    missing.map((food) => ({
      user_id: userId,
      name: food.name,
      state: food.state,
      protein_per_100: food.protein_per_100,
      fat_per_100: food.fat_per_100,
      carbs_per_100: food.carbs_per_100,
      kcal_per_100: food.kcal_per_100,
      default_portion_g: food.default_portion_g,
      default_portion_label: food.default_portion_label,
      yield_from_g: food.yield_from_g ?? null,
      yield_to_g: food.yield_to_g ?? null,
      is_favorite: FAVORITE_FOODS.has(food.name),
    })),
  );

  throwUnlessUniqueViolation(inserted.error);
  // A parallel seed may have won the insert; drop any leftover copies.
  await dedupeStarterFoods(supabase, userId);
}
