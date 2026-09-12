import { z } from "zod";

import { PLATE_GRAMS_MAX, PLATE_ITEM_LIMIT } from "@/lib/ai/plate-types";
import {
  LUMP_MACRO_MAX,
  LUMP_NAME_MAX,
  lumpMealItemSchema,
} from "@/lib/day/lump";
import {
  addMealItemWrites,
  type MealItemWrite,
} from "@/lib/day/meal-items-add";
import { getFood, listFoods } from "@/lib/food/store";
import type { Food, MealItem } from "@/lib/types";

export const plateCommitItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("food"),
    foodId: z.string().trim().min(1),
    grams: z.number().finite().positive().max(PLATE_GRAMS_MAX),
  }),
  z.object({
    kind: z.literal("lump"),
    name: z.string().trim().min(1).max(LUMP_NAME_MAX),
    protein: z.number().finite().min(0).max(LUMP_MACRO_MAX),
    fat: z.number().finite().min(0).max(LUMP_MACRO_MAX),
    carbs: z.number().finite().min(0).max(LUMP_MACRO_MAX),
  }),
]);

export const plateCommitSchema = z
  .object({
    items: z.array(plateCommitItemSchema).min(1).max(PLATE_ITEM_LIMIT),
  })
  .superRefine((value, ctx) => {
    for (const [index, item] of value.items.entries()) {
      if (item.kind !== "lump") {
        continue;
      }
      if (item.protein + item.fat + item.carbs <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lump macros empty",
          path: ["items", index],
        });
      }
    }
  });

export type PlateCommitInput = z.infer<typeof plateCommitSchema>;

export async function commitPlateItems(
  userId: string,
  mealId: string,
  input: PlateCommitInput,
): Promise<MealItem[]> {
  const foods = await listFoods(userId, "all");
  const byId = new Map(foods.map((food) => [food.id, food] as const));
  const writes: MealItemWrite[] = [];

  for (const row of input.items) {
    if (row.kind === "lump") {
      writes.push({
        kind: "lump",
        input: lumpMealItemSchema.parse({
          name: row.name,
          protein: row.protein,
          fat: row.fat,
          carbs: row.carbs,
        }),
      });
      continue;
    }

    writes.push({
      kind: "food",
      food: await resolveCommitFood(userId, row.foodId, byId),
      grams: row.grams,
    });
  }

  return addMealItemWrites(userId, mealId, writes);
}

async function resolveCommitFood(
  userId: string,
  foodId: string,
  byId: Map<string, Food>,
): Promise<Food> {
  const cached = byId.get(foodId);
  if (cached) {
    return cached;
  }
  const existing = await getFood(userId, foodId);
  if (!existing) {
    throw new Error("Food not found");
  }
  byId.set(existing.id, existing);
  return existing;
}
