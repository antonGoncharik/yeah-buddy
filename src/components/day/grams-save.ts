import { patchJson, postJson } from "@/lib/api-cache";
import { readCachedDay, withDayOptimistic } from "@/lib/day/cache";
import {
  mealItemFromFood,
  mealItemFromLump,
  withAddedItem,
  withReplacedItem,
  withUpdatedItemGrams,
  withUpdatedLump,
} from "@/lib/day/optimistic";
import {
  readMealItemPayload,
  readMealTemplateItemPayload,
} from "@/lib/meal/parse";
import {
  readCachedTemplate,
  templateItemFromFood,
  withAddedTemplateItem,
  withReplacedTemplateItem,
  withTemplateItemGrams,
  withTemplateOptimistic,
} from "@/lib/meal/template-cache";
import { isMealType } from "@/lib/nutrition";
import type { DayType, Food, MealItem } from "@/lib/types";

export async function saveMealItemGrams({
  date,
  item,
  grams,
}: {
  date: string;
  item: MealItem;
  grams: number;
}): Promise<void> {
  const current = readCachedDay(date);
  if (!current) {
    await patchJson(`/api/meal-items/${item.id}`, { grams });
    return;
  }

  await withDayOptimistic(
    date,
    withUpdatedItemGrams(current, item.id, grams),
    async () => {
      const data = await patchJson(`/api/meal-items/${item.id}`, { grams });
      const saved = readMealItemPayload(data);
      const latest = readCachedDay(date);
      if (saved && latest) {
        return withReplacedItem(latest, item.id, saved);
      }
      return latest ?? "keep";
    },
  );
}

export async function addMealItemGrams({
  date,
  mealId,
  food,
  grams,
}: {
  date: string;
  mealId: string;
  food: Pick<
    Food,
    | "id"
    | "name"
    | "protein_per_100"
    | "fat_per_100"
    | "carbs_per_100"
    | "kcal_per_100"
  >;
  grams: number;
}): Promise<void> {
  const current = readCachedDay(date);
  if (!current) {
    await postJson(`/api/meals/${mealId}/items`, { foodId: food.id, grams });
    return;
  }

  const temp = mealItemFromFood({ mealId, food, grams });
  await withDayOptimistic(
    date,
    withAddedItem(current, mealId, temp),
    async () => {
      const data = await postJson(`/api/meals/${mealId}/items`, {
        foodId: food.id,
        grams,
      });
      const saved = readMealItemPayload(data);
      const latest = readCachedDay(date);
      if (saved && latest) {
        return withReplacedItem(latest, temp.id, saved);
      }
      return latest ?? "keep";
    },
  );
}

export async function addLumpMealItem({
  date,
  mealId,
  input,
}: {
  date: string;
  mealId: string;
  input: { name: string; protein: number; fat: number; carbs: number };
}): Promise<void> {
  const current = readCachedDay(date);
  if (!current) {
    await postJson(`/api/meals/${mealId}/items`, input);
    return;
  }

  const temp = mealItemFromLump(mealId, input);
  await withDayOptimistic(
    date,
    withAddedItem(current, mealId, temp),
    async () => {
      const data = await postJson(`/api/meals/${mealId}/items`, input);
      const saved = readMealItemPayload(data);
      const latest = readCachedDay(date);
      if (saved && latest) {
        return withReplacedItem(latest, temp.id, saved);
      }
      return latest ?? "keep";
    },
  );
}

export async function saveLumpMealItem({
  date,
  itemId,
  input,
}: {
  date: string;
  itemId: string;
  input: { name: string; protein: number; fat: number; carbs: number };
}): Promise<void> {
  const current = readCachedDay(date);
  if (!current) {
    await patchJson(`/api/meal-items/${itemId}`, input);
    return;
  }

  await withDayOptimistic(
    date,
    withUpdatedLump(current, itemId, input),
    async () => {
      const data = await patchJson(`/api/meal-items/${itemId}`, input);
      const saved = readMealItemPayload(data);
      const latest = readCachedDay(date);
      if (saved && latest) {
        return withReplacedItem(latest, itemId, saved);
      }
      return latest ?? "keep";
    },
  );
}

export async function addTemplateItemGrams(
  dayType: DayType,
  mealType: string,
  food: Food,
  grams: number,
): Promise<void> {
  const template = readCachedTemplate(dayType);
  if (!template || !isMealType(mealType)) {
    await postJson(`/api/meal-templates/${dayType}/items`, {
      mealType,
      foodId: food.id,
      grams,
    });
    return;
  }

  const temp = templateItemFromFood({ template, mealType, food, grams });
  await withTemplateOptimistic(
    dayType,
    withAddedTemplateItem(template, temp),
    async () => {
      const data = await postJson(`/api/meal-templates/${dayType}/items`, {
        mealType,
        foodId: food.id,
        grams,
      });
      const saved = readMealTemplateItemPayload(data);
      const latest = readCachedTemplate(dayType);
      if (saved && latest) {
        return withReplacedTemplateItem(latest, temp.id, saved);
      }
      return latest ?? "keep";
    },
  );
}

export async function saveTemplateItemGrams(
  dayType: DayType,
  itemId: string,
  grams: number,
): Promise<void> {
  const template = readCachedTemplate(dayType);
  if (!template) {
    await patchJson(`/api/meal-template-items/${itemId}`, { grams });
    return;
  }

  await withTemplateOptimistic(
    dayType,
    withTemplateItemGrams(template, itemId, grams),
    async () => {
      await patchJson(`/api/meal-template-items/${itemId}`, { grams });
      return "keep";
    },
  );
}
