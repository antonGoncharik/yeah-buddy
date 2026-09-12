import { patchJson, postJson } from "@/lib/api-cache";

export async function saveMealItemGrams(itemId: string, grams: number) {
  await patchJson(`/api/meal-items/${itemId}`, { grams });
}

export async function addMealItemGrams(
  mealId: string,
  foodId: string,
  grams: number,
) {
  await postJson(`/api/meals/${mealId}/items`, { foodId, grams });
}

export async function addTemplateItemGrams(
  dayType: string,
  mealType: string,
  foodId: string,
  grams: number,
) {
  await postJson(`/api/meal-templates/${dayType}/items`, {
    mealType,
    foodId,
    grams,
  });
}

export async function saveTemplateItemGrams(itemId: string, grams: number) {
  await patchJson(`/api/meal-template-items/${itemId}`, { grams });
}
