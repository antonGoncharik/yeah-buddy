import { z } from "zod";

import { PLATE_GRAMS_MAX, PLATE_ITEM_LIMIT } from "@/lib/ai/plate-types";
import { addMealItems } from "@/lib/day/meal-items";
import { createFood, deleteFood, getFood, listFoods } from "@/lib/food/store";
import { FOOD_STATES, foodInputSchema } from "@/lib/foods";
import { calcKcalFromMacros } from "@/lib/nutrition";
import { foodMatchKey } from "@/lib/share/payload";
import type { Food, MealItem } from "@/lib/types";

export const plateCommitItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("food"),
    foodId: z.string().trim().min(1),
    grams: z.number().finite().positive().max(PLATE_GRAMS_MAX),
  }),
  z.object({
    kind: z.literal("new"),
    name: z.string().trim().min(1).max(80),
    state: z.enum(FOOD_STATES).optional(),
    protein_per_100: z.number().finite().min(0).max(100),
    fat_per_100: z.number().finite().min(0).max(100),
    carbs_per_100: z.number().finite().min(0).max(100),
    grams: z.number().finite().positive().max(PLATE_GRAMS_MAX),
  }),
]);

export const plateCommitSchema = z.object({
  items: z.array(plateCommitItemSchema).min(1).max(PLATE_ITEM_LIMIT),
});

export type PlateCommitInput = z.infer<typeof plateCommitSchema>;

export async function commitPlateItems(
  userId: string,
  mealId: string,
  input: PlateCommitInput,
): Promise<MealItem[]> {
  const foods = await listFoods(userId, "all");
  const byId = new Map(foods.map((food) => [food.id, food] as const));
  const byKey = new Map(
    foods.map((food) => [foodMatchKey(food), food] as const),
  );
  const createdIds: string[] = [];
  const resolved: Array<{ food: Food; grams: number }> = [];

  try {
    for (const row of input.items) {
      const resolvedFood = await resolveCommitFood(userId, row, byId, byKey);
      if (resolvedFood.created) {
        createdIds.push(resolvedFood.food.id);
      }
      resolved.push({ food: resolvedFood.food, grams: row.grams });
    }

    return await addMealItems(userId, mealId, resolved);
  } catch (error) {
    await rollbackCreatedFoods(userId, createdIds);
    throw error;
  }
}

async function resolveCommitFood(
  userId: string,
  row: PlateCommitInput["items"][number],
  byId: Map<string, Food>,
  byKey: Map<string, Food>,
): Promise<{ food: Food; created: boolean }> {
  if (row.kind === "food") {
    const cached = byId.get(row.foodId);
    if (cached) {
      return { food: cached, created: false };
    }
    const existing = await getFood(userId, row.foodId);
    if (!existing) {
      throw new Error("Food not found");
    }
    byId.set(existing.id, existing);
    byKey.set(foodMatchKey(existing), existing);
    return { food: existing, created: false };
  }

  const parsed = foodInputSchema.parse({
    name: row.name,
    state: row.state ?? "as_is",
    protein_per_100: row.protein_per_100,
    fat_per_100: row.fat_per_100,
    carbs_per_100: row.carbs_per_100,
    kcal_per_100: calcKcalFromMacros(
      row.protein_per_100,
      row.fat_per_100,
      row.carbs_per_100,
    ),
    default_portion_g: null,
    is_favorite: false,
  });
  const key = foodMatchKey({
    name: parsed.name,
    state: parsed.state ?? "as_is",
    protein_per_100: parsed.protein_per_100,
    fat_per_100: parsed.fat_per_100,
    carbs_per_100: parsed.carbs_per_100,
  });
  const matched = byKey.get(key);
  if (matched) {
    return { food: matched, created: false };
  }

  const created = await createFood(userId, parsed);
  byId.set(created.id, created);
  byKey.set(key, created);
  return { food: created, created: true };
}

async function rollbackCreatedFoods(userId: string, ids: string[]) {
  for (const id of ids) {
    try {
      await deleteFood(userId, id);
    } catch {
      // Meal write already failed; leftover food is better than a half-written meal.
    }
  }
}
