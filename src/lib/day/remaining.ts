import { isMealVisible, MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
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

export interface RemainingFill {
  mealType: MealType;
  foodId: string;
  name: string;
  grams: number;
}

export interface LoggedRecipeItem {
  food_id: string | null;
  name_snapshot: string;
  grams: number;
}

export interface RemainingMeal {
  meal_type: MealType;
  items: LoggedRecipeItem[];
}

interface PlannedLine {
  mealType: MealType;
  foodId: string;
  name: string;
  grams: number;
}

export function remainingFills(
  recipe: RecipeLine[],
  meals: RemainingMeal[],
  isTrainingDay: boolean,
): RemainingFill[] {
  const planned = plannedLines(recipe, isTrainingDay);
  const remainingByFood = new Map<string, number>();

  for (const line of planned) {
    remainingByFood.set(
      line.foodId,
      (remainingByFood.get(line.foodId) ?? 0) + line.grams,
    );
  }

  for (const [foodId, plannedGrams] of remainingByFood) {
    const name = planned.find((line) => line.foodId === foodId)?.name ?? "";
    let used = 0;
    for (const meal of meals) {
      used += usedInItems(meal.items, foodId, name);
    }
    remainingByFood.set(foodId, plannedGrams - used);
  }

  const fills: RemainingFill[] = [];
  for (const mealType of MEAL_DISPLAY_ORDER) {
    const meal = meals.find((entry) => entry.meal_type === mealType);
    const items = meal?.items ?? [];
    for (const line of planned) {
      if (line.mealType !== mealType) {
        continue;
      }
      const leftover = remainingByFood.get(line.foodId) ?? 0;
      const shortfall = line.grams - usedInItems(items, line.foodId, line.name);
      const take = Math.min(Math.max(0, shortfall), leftover);
      if (take < 1) {
        continue;
      }
      fills.push({
        mealType,
        foodId: line.foodId,
        name: line.name,
        grams: take,
      });
      remainingByFood.set(line.foodId, leftover - take);
    }
  }

  return fills;
}

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

function plannedLines(
  recipe: RecipeLine[],
  isTrainingDay: boolean,
): PlannedLine[] {
  const planned: PlannedLine[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of recipe) {
    if (!isMealVisible(item.mealType, isTrainingDay)) {
      continue;
    }
    if (!(item.grams > 0) || item.foodId === "") {
      continue;
    }

    const key = `${item.mealType}|${item.foodId}`;
    const existing = indexByKey.get(key);
    if (existing !== undefined) {
      planned[existing].grams += item.grams;
      continue;
    }

    indexByKey.set(key, planned.length);
    planned.push({
      mealType: item.mealType,
      foodId: item.foodId,
      name: item.name,
      grams: item.grams,
    });
  }

  return planned;
}

function usedInItems(
  items: LoggedRecipeItem[],
  foodId: string,
  name: string,
): number {
  const nameKey = name.trim().toLowerCase();
  let used = 0;
  for (const item of items) {
    if (!(item.grams > 0)) {
      continue;
    }
    if (item.food_id) {
      if (item.food_id === foodId) {
        used += item.grams;
      }
      continue;
    }
    if (nameKey !== "" && item.name_snapshot.trim().toLowerCase() === nameKey) {
      used += item.grams;
    }
  }
  return used;
}
