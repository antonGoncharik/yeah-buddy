import {
  LUMP_PORTION_G,
  type LumpMealItemInput,
  macrosFromLump,
} from "@/lib/day/lump";
import { mapMealItem } from "@/lib/day/map";
import { assertUserDayWritable } from "@/lib/day/writable";
import { getFood } from "@/lib/food/store";
import {
  calcMacrosFromPer100,
  type Macros,
  roundMacros,
} from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food, MealItem } from "@/lib/types";

export type MealItemWrite =
  | { kind: "food"; food: Food; grams: number }
  | { kind: "lump"; input: LumpMealItemInput };

export async function getDateForMeal(
  userId: string,
  mealId: string,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("day_id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    return null;
  }

  const day = await supabase
    .from("days")
    .select("date")
    .eq("id", meal.data.day_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (day.error) {
    throw day.error;
  }

  if (!day.data) {
    return null;
  }

  return String(day.data.date).slice(0, 10);
}

export function buildMealItemRow({
  userId,
  mealId,
  foodId,
  name,
  grams,
  per100,
}: {
  userId: string;
  mealId: string;
  foodId: string | null;
  name: string;
  grams: number;
  per100: Macros;
}) {
  const macros = roundMacros(calcMacrosFromPer100(per100, grams));

  return {
    user_id: userId,
    meal_id: mealId,
    food_id: foodId,
    name_snapshot: name,
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: per100,
  };
}

export async function addMealItem(
  userId: string,
  mealId: string,
  foodId: string,
  grams: number,
): Promise<MealItem> {
  const food = await getFood(userId, foodId);
  if (!food) {
    throw new Error("Food not found");
  }

  const items = await addMealItems(userId, mealId, [{ food, grams }]);
  const item = items[0];
  if (!item) {
    throw new Error("Meal item insert failed");
  }
  return item;
}

export async function addMealItems(
  userId: string,
  mealId: string,
  entries: Array<{ food: Food; grams: number }>,
): Promise<MealItem[]> {
  return addMealItemWrites(
    userId,
    mealId,
    entries.map((entry) => ({
      kind: "food",
      food: entry.food,
      grams: entry.grams,
    })),
  );
}

export async function addLumpMealItem(
  userId: string,
  mealId: string,
  input: LumpMealItemInput,
): Promise<MealItem> {
  const items = await addMealItemWrites(userId, mealId, [
    { kind: "lump", input },
  ]);
  const item = items[0];
  if (!item) {
    throw new Error("Meal item insert failed");
  }
  return item;
}

export async function addMealItemWrites(
  userId: string,
  mealId: string,
  writes: MealItemWrite[],
): Promise<MealItem[]> {
  if (writes.length === 0) {
    throw new Error("Meal items empty");
  }

  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  await assertUserDayWritable(userId, date);

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("meal_items")
    .insert(writes.map((write) => toMealItemRow(userId, mealId, write)))
    .select("*");

  if (inserted.error) {
    throw inserted.error;
  }

  return (inserted.data ?? []).map((row) =>
    mapMealItem(row as Record<string, unknown>),
  );
}

function toMealItemRow(userId: string, mealId: string, write: MealItemWrite) {
  if (write.kind === "food") {
    return buildMealItemRow({
      userId,
      mealId,
      foodId: write.food.id,
      name: write.food.name,
      grams: write.grams,
      per100: {
        protein: write.food.protein_per_100,
        fat: write.food.fat_per_100,
        carbs: write.food.carbs_per_100,
        kcal: write.food.kcal_per_100,
      },
    });
  }

  return buildMealItemRow({
    userId,
    mealId,
    foodId: null,
    name: write.input.name,
    grams: LUMP_PORTION_G,
    per100: macrosFromLump(write.input),
  });
}

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
