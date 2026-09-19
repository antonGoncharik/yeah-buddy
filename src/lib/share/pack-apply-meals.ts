import { replaceMealTemplateItems } from "@/lib/meal-templates";
import { isMealVisible } from "@/lib/nutrition";
import { saveUserSettings } from "@/lib/settings";
import { ensurePackFoods, packLineFood } from "@/lib/share/pack-apply-foods";
import type { MealsPackPayload } from "@/lib/share/payload";

export async function applyMealsPack(
  userId: string,
  payload: MealsPackPayload,
): Promise<void> {
  const byKey = await ensurePackFoods(userId, payload.foods);

  for (const day of payload.templates) {
    const items = day.items.flatMap((item) => {
      if (!isMealVisible(item.meal_type, day.day_type === "training")) {
        return [];
      }
      const food = packLineFood(byKey, item);
      if (!food) {
        return [];
      }
      return [
        {
          mealType: item.meal_type,
          foodId: food.id,
          grams: item.grams,
        },
      ];
    });
    await replaceMealTemplateItems(userId, day.day_type, items);
  }

  await saveUserSettings(userId, {
    rest_protein: payload.goals.rest_protein,
    rest_fat: payload.goals.rest_fat,
    rest_carbs: payload.goals.rest_carbs,
    training_protein: payload.goals.training_protein,
    training_fat: payload.goals.training_fat,
    training_carbs: payload.goals.training_carbs,
  });
}
