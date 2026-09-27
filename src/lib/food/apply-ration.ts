import { foodNameKey } from "@/lib/food/dedupe-foods";
import {
  fitRationDay,
  macroGoalsFromSettings,
  RationFoodMissingError,
  type RationId,
  rationById,
} from "@/lib/food/ration";
import { listFoods } from "@/lib/food/store";
import { replaceMealTemplateItems } from "@/lib/meal-templates";
import { ensureInitialData } from "@/lib/seed";
import { getUserSettings } from "@/lib/settings";
import type { MealTemplateDetail } from "@/lib/types";

export async function applyRation(
  userId: string,
  id: RationId,
): Promise<MealTemplateDetail[]> {
  const preset = rationById(id);
  if (!preset) {
    throw new RationFoodMissingError();
  }

  await ensureInitialData(userId);
  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error("Настройки не нашлись.");
  }

  const foods = await listFoods(userId);
  const goals = macroGoalsFromSettings(settings);
  const updated: MealTemplateDetail[] = [];

  for (const day of preset.days) {
    const target = day.dayType === "training" ? goals.training : goals.rest;
    const fitted = fitRationDay(day.dayType, day.items, foods, target);
    const items = fitted.items.map((line) => {
      const food = foods.find(
        (entry) => foodNameKey(entry.name) === foodNameKey(line.foodName),
      );
      if (!food) {
        throw new RationFoodMissingError(line.foodName);
      }
      return {
        mealType: line.mealType,
        foodId: food.id,
        grams: line.grams,
      };
    });
    updated.push(await replaceMealTemplateItems(userId, day.dayType, items));
  }

  return updated;
}
