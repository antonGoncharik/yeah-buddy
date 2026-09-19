import { getDayByDate } from "@/lib/day/store";
import { getUserCalendarToday } from "@/lib/day/writable";
import { upsertNamedMealFromItems } from "@/lib/named-meal/write";
import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  isMealVisible,
  roundMacros,
} from "@/lib/nutrition";
import { ensurePackFoods, packLineFood } from "@/lib/share/pack-apply-foods";
import type { MealPackPayload } from "@/lib/share/payload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyMealPack(
  userId: string,
  payload: MealPackPayload,
): Promise<void> {
  const byKey = await ensurePackFoods(userId, payload.foods);
  const items = payload.items.map((item) => {
    const food = packLineFood(byKey, item);
    const per100 = {
      protein: item.protein_per_100,
      fat: item.fat_per_100,
      carbs: item.carbs_per_100,
      kcal: calcKcalFromMacros(
        item.protein_per_100,
        item.fat_per_100,
        item.carbs_per_100,
      ),
    };
    const macros = roundMacros(calcMacrosFromPer100(per100, item.grams));
    return {
      food_id: food?.id ?? null,
      name_snapshot: item.food_name,
      grams: item.grams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
      per_100_snapshot: per100,
    };
  });

  await upsertNamedMealFromItems(
    userId,
    payload.name,
    payload.meal_type,
    items,
  );

  const today = await getUserCalendarToday(userId);
  const day = await getDayByDate(userId, today);
  if (!day || !isMealVisible(payload.meal_type, day.is_training_day)) {
    return;
  }
  const target = day.meals.find((meal) => meal.meal_type === payload.meal_type);
  if (!target || target.items.length > 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const inserted = await supabase.from("meal_items").insert(
    items.map((item) => ({
      user_id: userId,
      meal_id: target.id,
      food_id: item.food_id,
      name_snapshot: item.name_snapshot,
      grams: item.grams,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      kcal: item.kcal,
      per_100_snapshot: item.per_100_snapshot,
    })),
  );
  if (inserted.error) {
    throw inserted.error;
  }
}
