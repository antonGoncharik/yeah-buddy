import { remainingFills } from "@/lib/day/remaining-plan";
import type {
  RecipeLine,
  RemainingFill,
  RemainingLine,
  RemainingMeal,
} from "@/lib/day/remaining-types";
import { isMealVisible } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

export { remainingFills } from "@/lib/day/remaining-plan";
export type {
  LoggedRecipeItem,
  RecipeLine,
  RemainingFill,
  RemainingLine,
  RemainingMeal,
} from "@/lib/day/remaining-types";

export function remainingRecipe(
  recipe: RecipeLine[],
  meals: RemainingMeal[],
  isTrainingDay: boolean,
): RemainingLine[] {
  return remainingLines(remainingFills(recipe, meals, isTrainingDay));
}

export function remainingLines(fills: RemainingFill[]): RemainingLine[] {
  const byFood = new Map<string, RemainingLine>();
  const order: string[] = [];
  for (const fill of fills) {
    const existing = byFood.get(fill.foodId);
    if (existing) {
      existing.grams += fill.grams;
      continue;
    }
    byFood.set(fill.foodId, { name: fill.name, grams: fill.grams });
    order.push(fill.foodId);
  }
  return order.flatMap((foodId) => {
    const line = byFood.get(foodId);
    return line ? [line] : [];
  });
}

export function formatRemainingLine(items: RemainingLine[]): string | null {
  if (items.length === 0) {
    return null;
  }

  const parts = items.map((item) => `${item.name} ${Math.round(item.grams)} г`);
  return `Ещё ${parts.join(", ")}`;
}

export function isFullTemplateGap(
  recipe: RecipeLine[],
  fills: RemainingFill[],
  isTrainingDay: boolean,
): boolean {
  if (fills.length === 0) {
    return false;
  }

  let planned = 0;
  for (const item of recipe) {
    if (!isMealVisible(item.mealType, isTrainingDay)) {
      continue;
    }
    if (!(item.grams > 0) || item.foodId === "") {
      continue;
    }
    planned += item.grams;
  }

  let remaining = 0;
  for (const fill of fills) {
    remaining += fill.grams;
  }

  return planned > 0 && remaining + 0.5 >= planned;
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
