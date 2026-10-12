import { mealItemRestoreBody } from "@/lib/day/meal-item-restore";
import type { MealItem } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const foodItem: MealItem = {
  id: "i1",
  user_id: "u",
  meal_id: "m1",
  food_id: "f1",
  name_snapshot: "Творог",
  grams: 150,
  protein: 20,
  fat: 5,
  carbs: 6,
  kcal: 150,
  per_100_snapshot: { protein: 10, fat: 3, carbs: 4, kcal: 100 },
  created_at: "",
  updated_at: "",
};

assertEqual(
  mealItemRestoreBody(foodItem),
  { foodId: "f1", grams: 150 },
  "food restore",
);

const lumpItem: MealItem = {
  ...foodItem,
  food_id: null,
  name_snapshot: "Салат",
  protein: 5,
  fat: 10,
  carbs: 8,
};

assertEqual(
  mealItemRestoreBody(lumpItem),
  { name: "Салат", protein: 5, fat: 10, carbs: 8 },
  "lump restore",
);
