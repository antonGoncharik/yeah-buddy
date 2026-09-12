import {
  LUMP_PORTION_G,
  type LumpMealItemInput,
  macrosFromLump,
} from "@/lib/day/lump";
import { mapMealItem } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { assertUserDayWritable } from "@/lib/day/writable";
import { calcMacrosFromPer100, roundMacros } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealItem } from "@/lib/types";

export { getDateForMeal } from "@/lib/day/meal-date";
export { buildMealItemRow } from "@/lib/day/meal-item-row";
export {
  addLumpMealItem,
  addMealItem,
  addMealItems,
} from "@/lib/day/meal-items-add";

export async function getMealItem(
  userId: string,
  itemId: string,
): Promise<MealItem | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("meal_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapMealItem(result.data as Record<string, unknown>);
}

export async function updateMealItemGrams(
  userId: string,
  itemId: string,
  grams: number,
): Promise<MealItem> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    throw new Error("Meal item not found");
  }
  if (item.food_id == null) {
    throw new Error("Not a catalog item");
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    throw new Error("Meal item not found");
  }
  await assertUserDayWritable(userId, date);

  const macros = roundMacros(
    calcMacrosFromPer100(item.per_100_snapshot, grams),
  );
  return writeMealItem(userId, itemId, {
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  });
}

export async function updateLumpMealItem(
  userId: string,
  itemId: string,
  input: LumpMealItemInput,
): Promise<MealItem> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    throw new Error("Meal item not found");
  }
  if (item.food_id) {
    throw new Error("Not a lump item");
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    throw new Error("Meal item not found");
  }
  await assertUserDayWritable(userId, date);

  const macros = macrosFromLump(input);
  return writeMealItem(userId, itemId, {
    name_snapshot: input.name,
    grams: LUMP_PORTION_G,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: macros,
  });
}

async function writeMealItem(
  userId: string,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<MealItem> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("meal_items")
    .update(patch)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Meal item not found");
  }

  return mapMealItem(updated.data as Record<string, unknown>);
}

export async function deleteMealItem(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    return false;
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    return false;
  }
  await assertUserDayWritable(userId, date);

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("meal_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    throw deleted.error;
  }

  return Boolean(deleted.data);
}
