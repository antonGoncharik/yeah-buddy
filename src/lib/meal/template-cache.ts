import { reportActionError } from "@/lib/action-error";
import {
  beginMutation,
  endMutation,
  peekJson,
  writeJson,
} from "@/lib/api-cache";
import { tempId } from "@/lib/day/optimistic";
import { readMealTemplatePayload } from "@/lib/meal/parse";
import { LOAD_FAILED } from "@/lib/messages";
import { calcMacrosFromPer100, roundMacros } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type {
  DayType,
  Food,
  MealTemplateDetail,
  MealTemplateItemView,
  MealType,
} from "@/lib/types";

export function templatesUrl(dayType: DayType): string {
  return `/api/meal-templates/${dayType}`;
}

export function readCachedTemplate(
  dayType: DayType,
): MealTemplateDetail | null {
  return readMealTemplatePayload(peekJson(templatesUrl(dayType)));
}

export function writeCachedTemplate(
  dayType: DayType,
  template: MealTemplateDetail | null,
): void {
  writeJson(templatesUrl(dayType), { template });
}

export async function withTemplateOptimistic(
  dayType: DayType,
  next: MealTemplateDetail | null,
  work: () => Promise<MealTemplateDetail | null | "keep">,
): Promise<void> {
  const url = templatesUrl(dayType);
  const previous = peekJson(url);
  beginMutation(url);
  writeCachedTemplate(dayType, next);
  try {
    const result = await work();
    if (result !== "keep") {
      writeCachedTemplate(dayType, result);
    }
  } catch (caught) {
    if (previous == null) {
      writeCachedTemplate(dayType, null);
    } else {
      writeJson(url, previous);
    }
    haptic("error");
    reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
  } finally {
    endMutation(url);
  }
}

export function templateItemFromFood({
  template,
  mealType,
  food,
  grams,
}: {
  template: MealTemplateDetail;
  mealType: MealType;
  food: Food;
  grams: number;
}): MealTemplateItemView {
  const macros = roundMacros(
    calcMacrosFromPer100(
      {
        protein: food.protein_per_100,
        fat: food.fat_per_100,
        carbs: food.carbs_per_100,
        kcal: food.kcal_per_100,
      },
      grams,
    ),
  );
  const maxOrder = template.items.reduce(
    (max, item) => (item.sort_order > max ? item.sort_order : max),
    0,
  );
  return {
    id: tempId("tpl"),
    user_id: template.user_id,
    template_id: template.id,
    meal_type: mealType,
    food_id: food.id,
    grams,
    sort_order: maxOrder + 10,
    created_at: new Date().toISOString(),
    food,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}

export function withTemplateItemGrams(
  template: MealTemplateDetail,
  itemId: string,
  grams: number,
): MealTemplateDetail {
  return {
    ...template,
    items: template.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }
      const macros = roundMacros(
        calcMacrosFromPer100(
          {
            protein: item.food.protein_per_100,
            fat: item.food.fat_per_100,
            carbs: item.food.carbs_per_100,
            kcal: item.food.kcal_per_100,
          },
          grams,
        ),
      );
      return {
        ...item,
        grams,
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs,
        kcal: macros.kcal,
      };
    }),
  };
}

export function withRemovedTemplateItem(
  template: MealTemplateDetail,
  itemId: string,
): MealTemplateDetail {
  return {
    ...template,
    items: template.items.filter((item) => item.id !== itemId),
  };
}

export function withAddedTemplateItem(
  template: MealTemplateDetail,
  item: MealTemplateItemView,
): MealTemplateDetail {
  return { ...template, items: [...template.items, item] };
}

export function withReplacedTemplateItem(
  template: MealTemplateDetail,
  itemId: string,
  next: MealTemplateItemView,
): MealTemplateDetail {
  return {
    ...template,
    items: template.items.map((item) => (item.id === itemId ? next : item)),
  };
}
