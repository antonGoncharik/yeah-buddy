import { getDayByDate } from "@/lib/day/store";
import { getUserCalendarToday } from "@/lib/day/writable";
import { filterAndSortFoodsBySearch } from "@/lib/food/catalog-map";
import { listFoods } from "@/lib/food/store";
import { sumMealItems } from "@/lib/nutrition";
import { macroShortfallGrams } from "@/lib/nutrition/macro-hit";
import { mapSettings } from "@/lib/settings/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextCircleName } from "@/lib/telegram/reminder-facts";
import { getMuscleSnapshot } from "@/lib/workout/muscle-load";

export type AssistantToolBundle = {
  today: {
    date: string;
    protein: number;
    targetProtein: number;
    kcal: number;
    targetKcal: number;
    remainingProtein: number;
  } | null;
  nextWorkout: string | null;
  muscles: Array<{ id: string; sets_per_week: number }>;
  foods: Array<{
    name: string;
    protein_per_100: number;
    fat_per_100: number;
    carbs_per_100: number;
    kcal_per_100: number;
  }>;
};

export function assistantFoodSearchQuery(question: string): string | null {
  if (
    !/продукт|еда|белк|ужин|завтрак|обед|перекус|калор|жир|углевод|съест|поест|грамм|блюд|рецепт/i.test(
      question,
    )
  ) {
    return null;
  }
  const tokens = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((part) => part.length >= 3)
    .slice(0, 3);
  const query = tokens.join(" ");
  return query.length > 0 ? query : null;
}

export async function gatherAssistantTools(
  userId: string,
  question: string,
): Promise<AssistantToolBundle> {
  const today = await getUserCalendarToday(userId);
  const day = await getDayByDate(userId, today);
  let todayMacros: AssistantToolBundle["today"] = null;
  if (day) {
    const fact = sumMealItems(day.meals.flatMap((meal) => meal.items));
    todayMacros = {
      date: today,
      protein: fact.protein,
      targetProtein: day.target_protein,
      kcal: fact.kcal,
      targetKcal: day.target_kcal,
      remainingProtein: macroShortfallGrams(fact.protein, day.target_protein),
    };
  }

  const nextWorkout = await nextCircleName(userId);
  const muscles = (await getMuscleSnapshot(userId, 7)).muscles
    .filter((row) => row.sets > 0)
    .slice(0, 8)
    .map((row) => ({ id: row.id, sets_per_week: row.sets_per_week }));

  const foods: AssistantToolBundle["foods"] = [];
  const query = assistantFoodSearchQuery(question);
  if (query) {
    const rows = await listFoods(userId, "all", { search: query, limit: 80 });
    const ranked = filterAndSortFoodsBySearch(rows, query).slice(0, 8);
    for (const food of ranked) {
      foods.push({
        name: food.name,
        protein_per_100: food.protein_per_100,
        fat_per_100: food.fat_per_100,
        carbs_per_100: food.carbs_per_100,
        kcal_per_100: food.kcal_per_100,
      });
    }
  }

  return {
    today: todayMacros,
    nextWorkout,
    muscles,
    foods,
  };
}

export async function readAssistantProfile(userId: string) {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error || !result.data) {
    return null;
  }
  return mapSettings(result.data as Record<string, unknown>);
}
