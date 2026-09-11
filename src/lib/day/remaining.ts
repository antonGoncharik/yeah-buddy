import { isMealVisible } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

export interface RecipeLine {
  foodId: string;
  name: string;
  grams: number;
  mealType: MealType;
}

export interface RemainingLine {
  name: string;
  grams: number;
}

export interface LoggedRecipeItem {
  food_id: string | null;
  name_snapshot: string;
  grams: number;
}

export function remainingRecipe(
  recipe: RecipeLine[],
  logged: LoggedRecipeItem[],
  isTrainingDay: boolean,
): RemainingLine[] {
  const planned = new Map<
    string,
    { name: string; grams: number; order: number }
  >();
  let order = 0;

  for (const item of recipe) {
    if (!isMealVisible(item.mealType, isTrainingDay)) {
      continue;
    }
    if (!(item.grams > 0) || item.foodId === "") {
      continue;
    }

    const existing = planned.get(item.foodId);
    if (existing) {
      existing.grams += item.grams;
      continue;
    }

    planned.set(item.foodId, {
      name: item.name,
      grams: item.grams,
      order: order++,
    });
  }

  const usedByFood = new Map<string, number>();
  const usedByName = new Map<string, number>();
  for (const item of logged) {
    if (!(item.grams > 0)) {
      continue;
    }
    if (item.food_id) {
      usedByFood.set(
        item.food_id,
        (usedByFood.get(item.food_id) ?? 0) + item.grams,
      );
      continue;
    }

    const nameKey = item.name_snapshot.trim().toLowerCase();
    if (nameKey === "") {
      continue;
    }
    usedByName.set(nameKey, (usedByName.get(nameKey) ?? 0) + item.grams);
  }

  return [...planned.entries()]
    .sort((left, right) => left[1].order - right[1].order)
    .flatMap(([foodId, plan]) => {
      const used =
        (usedByFood.get(foodId) ?? 0) +
        (usedByName.get(plan.name.trim().toLowerCase()) ?? 0);
      const grams = plan.grams - used;
      if (grams < 1) {
        return [];
      }
      return [{ name: plan.name, grams }];
    });
}

export function formatRemainingLine(items: RemainingLine[]): string | null {
  if (items.length === 0) {
    return null;
  }

  const parts = items.map((item) => `${item.name} ${Math.round(item.grams)} г`);
  return `Ещё ${parts.join(", ")}`;
}

export function loggedItemsFromMeals(
  meals: Array<{ items: LoggedRecipeItem[] }>,
): LoggedRecipeItem[] {
  return meals.flatMap((meal) => meal.items);
}

export function recipeFromTemplate(
  template: {
    items: Array<{
      food_id: string;
      grams: number;
      meal_type: MealType;
      food: { name: string };
    }>;
  } | null,
): RecipeLine[] {
  if (!template) {
    return [];
  }

  return template.items.map((item) => ({
    foodId: item.food_id,
    name: item.food.name,
    grams: item.grams,
    mealType: item.meal_type,
  }));
}
