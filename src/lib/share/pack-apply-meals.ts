import { replaceMealTemplateItems } from "@/lib/meal-templates";
import { calcKcalFromMacros, isMealVisible } from "@/lib/nutrition";
import { saveUserSettings } from "@/lib/settings";
import { ensurePackFoods, packLineFood } from "@/lib/share/pack-apply-foods";
import {
  foodMatchKey,
  type MealsPackPayload,
  type PackFood,
} from "@/lib/share/payload";

export async function applyMealsPack(
  userId: string,
  payload: MealsPackPayload,
): Promise<void> {
  const byKey = await ensurePackFoods(userId, foodsForMealsPayload(payload));

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

export function foodsForMealsPayload(payload: MealsPackPayload): PackFood[] {
  const byKey = new Map<string, PackFood>();
  for (const food of payload.foods) {
    byKey.set(foodMatchKey(food), food);
  }

  for (const day of payload.templates) {
    for (const item of day.items) {
      const key = foodMatchKey({
        name: item.food_name,
        state: item.food_state,
        protein_per_100: item.protein_per_100,
        fat_per_100: item.fat_per_100,
        carbs_per_100: item.carbs_per_100,
      });
      if (byKey.has(key)) {
        continue;
      }
      byKey.set(key, {
        name: item.food_name,
        brand: null,
        state: item.food_state,
        protein_per_100: item.protein_per_100,
        fat_per_100: item.fat_per_100,
        carbs_per_100: item.carbs_per_100,
        kcal_per_100: calcKcalFromMacros(
          item.protein_per_100,
          item.fat_per_100,
          item.carbs_per_100,
        ),
        default_portion_g: null,
        default_portion_label: null,
        yield_from_g: null,
        yield_to_g: null,
        is_favorite: false,
      });
    }
  }

  return [...byKey.values()];
}
