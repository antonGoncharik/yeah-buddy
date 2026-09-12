import { calcMacrosFromPer100, roundMacros } from "@/lib/nutrition";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealItem } from "@/lib/types";

export function matchingItem(
  items: MealItem[],
  foodId: string,
  name: string,
): MealItem | undefined {
  const byId = items.find((item) => item.food_id === foodId);
  if (byId) {
    return byId;
  }

  const nameKey = name.trim().toLowerCase();
  return items.find(
    (item) =>
      !item.food_id && item.name_snapshot.trim().toLowerCase() === nameKey,
  );
}

export async function bumpItemGrams(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  item: MealItem,
  grams: number,
): Promise<void> {
  const nextGrams = item.grams + grams;
  const macros = roundMacros(
    calcMacrosFromPer100(item.per_100_snapshot, nextGrams),
  );
  const updated = await supabase
    .from("meal_items")
    .update({
      grams: nextGrams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
    })
    .eq("id", item.id)
    .eq("user_id", userId);

  if (updated.error) {
    throw updated.error;
  }
}
