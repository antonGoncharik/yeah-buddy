import {
  LUMP_PORTION_G,
  type LumpMealItemInput,
  macrosFromLump,
} from "@/lib/day/lump";
import { mapMealItem } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { buildMealItemRow } from "@/lib/day/meal-item-row";
import { assertUserDayWritable } from "@/lib/day/writable";
import { getFood } from "@/lib/food/list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food, MealItem } from "@/lib/types";

export type MealItemWrite =
  | { kind: "food"; food: Food; grams: number }
  | { kind: "lump"; input: LumpMealItemInput };

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
