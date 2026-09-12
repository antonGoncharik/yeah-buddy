import type {
  LoggedRecipeItem,
  PlannedLine,
  RecipeLine,
  RemainingFill,
  RemainingMeal,
} from "@/lib/day/remaining-types";
import { isMealVisible, MEAL_DISPLAY_ORDER } from "@/lib/nutrition";

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

export function plannedLines(
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

export function usedInItems(
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
