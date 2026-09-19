import { createFood, listFoods } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";
import {
  foodMatchKey,
  type PackFood,
  type PackMealLine,
} from "@/lib/share/payload";
import type { Food } from "@/lib/types";

export async function ensurePackFoods(
  userId: string,
  foods: PackFood[],
): Promise<Map<string, Food>> {
  const existing = await listFoods(userId, "all");
  const byKey = new Map(
    existing.map((food) => [foodMatchKey(food), food] as const),
  );

  for (const food of foods) {
    const key = foodMatchKey(food);
    if (byKey.has(key)) {
      continue;
    }

    const created = await createFood(
      userId,
      foodInputSchema.parse({
        name: food.name,
        brand: food.brand,
        state: food.state,
        protein_per_100: food.protein_per_100,
        fat_per_100: food.fat_per_100,
        carbs_per_100: food.carbs_per_100,
        kcal_per_100: food.kcal_per_100,
        default_portion_g: food.default_portion_g,
        default_portion_label: food.default_portion_label,
        yield_from_g: food.yield_from_g ?? null,
        yield_to_g: food.yield_to_g ?? null,
        is_favorite: food.is_favorite,
      }),
    );
    byKey.set(key, created);
  }

  return byKey;
}

export function packLineFood(
  byKey: Map<string, Food>,
  item: PackMealLine,
): Food | undefined {
  return byKey.get(
    foodMatchKey({
      name: item.food_name,
      state: item.food_state,
      protein_per_100: item.protein_per_100,
      fat_per_100: item.fat_per_100,
      carbs_per_100: item.carbs_per_100,
    }),
  );
}
