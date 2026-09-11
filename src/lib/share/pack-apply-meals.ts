import { createFood, listFoods } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";
import { replaceMealTemplateItems } from "@/lib/meal-templates";
import { isMealVisible } from "@/lib/nutrition";
import { saveUserSettings } from "@/lib/settings";
import { foodMatchKey, type MealsPackPayload } from "@/lib/share/payload";

export async function applyMealsPack(
  userId: string,
  payload: MealsPackPayload,
): Promise<void> {
  const foods = await listFoods(userId, "all");
  const byKey = new Map(
    foods.map((food) => [foodMatchKey(food), food] as const),
  );

  for (const food of payload.foods) {
    const key = foodMatchKey(food);
    if (byKey.has(key)) {
      continue;
    }

    const created = await createFood(
      userId,
      foodInputSchema.parse({
        name: food.name,
        brand: food.brand,
        state: food.state,
        protein_per_100: food.protein_per_100,
        fat_per_100: food.fat_per_100,
        carbs_per_100: food.carbs_per_100,
        kcal_per_100: food.kcal_per_100,
        default_portion_g: food.default_portion_g,
        default_portion_label: food.default_portion_label,
        yield_from_g: food.yield_from_g ?? null,
        yield_to_g: food.yield_to_g ?? null,
        is_favorite: food.is_favorite,
      }),
    );
    byKey.set(key, created);
  }

  for (const day of payload.templates) {
    const items = day.items.flatMap((item) => {
      if (!isMealVisible(item.meal_type, day.day_type === "training")) {
        return [];
      }
      const food = byKey.get(
        foodMatchKey({
          name: item.food_name,
          state: item.food_state,
          protein_per_100: item.protein_per_100,
          fat_per_100: item.fat_per_100,
          carbs_per_100: item.carbs_per_100,
        }),
      );
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
