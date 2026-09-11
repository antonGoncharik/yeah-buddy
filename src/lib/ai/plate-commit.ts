import { z } from "zod";

import { PLATE_GRAMS_MAX, PLATE_ITEM_LIMIT } from "@/lib/ai/plate-types";
import { addMealItem } from "@/lib/day/meal-items";
import { createFood, getFood, listFoods } from "@/lib/food/store";
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
  const items: MealItem[] = [];

  for (const row of input.items) {
    const foodId = await resolveCommitFoodId(userId, row, byId, byKey);
    const item = await addMealItem(userId, mealId, foodId, row.grams);
    items.push(item);
  }

  return items;
}

async function resolveCommitFoodId(
  userId: string,
  row: PlateCommitInput["items"][number],
  byId: Map<string, Food>,
  byKey: Map<string, Food>,
): Promise<string> {
  if (row.kind === "food") {
    if (byId.has(row.foodId)) {
      return row.foodId;
    }
    const existing = await getFood(userId, row.foodId);
    if (!existing) {
      throw new Error("Food not found");
    }
    byId.set(existing.id, existing);
    byKey.set(foodMatchKey(existing), existing);
    return existing.id;
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
    default_portion_g: row.grams,
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
    return matched.id;
  }

  const created = await createFood(userId, parsed);
  byId.set(created.id, created);
  byKey.set(key, created);
  return created.id;
}
