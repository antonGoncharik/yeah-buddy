import { createFood, listFoods, updateFood } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";
import { UNIQUE_VIOLATION } from "@/lib/seed-missing";
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
  const byName = new Map<string, Food>();
  for (const food of existing) {
    const name = foodNameKey(food.name);
    if (!byName.has(name)) {
      byName.set(name, food);
    }
  }

  for (const food of foods) {
    const key = foodMatchKey(food);
    if (byKey.has(key)) {
      continue;
    }

    const named = byName.get(foodNameKey(food.name));
    if (named) {
      const aligned = await alignNamedFood(userId, named, food);
      rememberFood(byKey, byName, key, aligned);
      continue;
    }

    try {
      const created = await createFood(userId, packFoodInput(food));
      rememberFood(byKey, byName, key, created);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      const raced = (await listFoods(userId, "all")).find(
        (row) => foodNameKey(row.name) === foodNameKey(food.name),
      );
      if (!raced) {
        throw error;
      }
      const aligned = await alignNamedFood(userId, raced, food);
      rememberFood(byKey, byName, key, aligned);
    }
  }

  return byKey;
}

function rememberFood(
  byKey: Map<string, Food>,
  byName: Map<string, Food>,
  packKey: string,
  food: Food,
): void {
  byKey.set(packKey, food);
  byKey.set(foodMatchKey(food), food);
  byName.set(foodNameKey(food.name), food);
}

async function alignNamedFood(
  userId: string,
  current: Food,
  packFood: PackFood,
): Promise<Food> {
  if (foodMatchKey(current) === foodMatchKey(packFood)) {
    return current;
  }

  const updated = await updateFood(userId, current.id, packFoodInput(packFood));
  return updated ?? current;
}

function packFoodInput(food: PackFood) {
  return foodInputSchema.parse({
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
  });
}

function foodNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  );
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
