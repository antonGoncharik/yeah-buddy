import { DayConflictError } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { buildMealItemRow } from "@/lib/day/meal-items";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import {
  calcKcalFromMacros,
  defaultMacroGoals,
  getMealOrder,
  isMealType,
  type Macros,
  MEAL_DISPLAY_ORDER,
} from "@/lib/nutrition";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType, MealType } from "@/lib/types";

export async function createDayFromTemplate(
  userId: string,
  date: string,
  dayType: DayType,
): Promise<DayWithMeals> {
  await assertUserDayWritable(userId, date);
  const existing = await getDayByDate(userId, date);
  if (existing) {
    throw new DayConflictError();
  }

  const supabase = createSupabaseServerClient();
  const targets = await getTargets(userId, dayType);
  const created = await supabase
    .from("days")
    .insert({
      user_id: userId,
      date,
      is_training_day: dayType === "training",
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .select("*")
    .single();

  if (created.error) {
    if (created.error.code === "23505") {
      throw new DayConflictError();
    }
    throw created.error;
  }

  const dayId = String(created.data.id);
  const mealIds = await insertEmptyMeals(supabase, userId, dayId);
  const template = await getActiveMealTemplate(userId, dayType);

  if (template && template.items.length > 0) {
    const rows = [];
    for (const item of template.items) {
      const mealId = mealIds.get(item.meal_type);
      if (!mealId) {
        continue;
      }

      rows.push(
        buildMealItemRow({
          userId,
          mealId,
          foodId: item.food.id,
          name: item.food.name,
          grams: item.grams,
          per100: {
            protein: item.food.protein_per_100,
            fat: item.food.fat_per_100,
            carbs: item.food.carbs_per_100,
            kcal: item.food.kcal_per_100,
          },
        }),
      );
    }

    if (rows.length > 0) {
      const insertedItems = await supabase.from("meal_items").insert(rows);
      if (insertedItems.error) {
        throw insertedItems.error;
      }
    }
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function insertEmptyMeals(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  dayId: string,
): Promise<Map<MealType, string>> {
  const inserted = await supabase
    .from("meals")
    .insert(
      MEAL_DISPLAY_ORDER.map((mealType) => ({
        user_id: userId,
        day_id: dayId,
        meal_type: mealType,
        sort_order: getMealOrder(mealType),
      })),
    )
    .select("id, meal_type");

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Meal insert failed");
  }

  const mealIds = new Map<MealType, string>();
  for (const row of inserted.data) {
    if (isMealType(row.meal_type) && typeof row.id === "string") {
      mealIds.set(row.meal_type, row.id);
    }
  }

  return mealIds;
}

export async function getTargets(
  userId: string,
  dayType: DayType,
): Promise<Macros> {
  const settings = await getUserSettings(userId);
  const fallback = defaultMacroGoals(dayType);
  const protein =
    (dayType === "training"
      ? settings?.training_protein
      : settings?.rest_protein) ?? fallback.protein;
  const fat =
    (dayType === "training" ? settings?.training_fat : settings?.rest_fat) ??
    fallback.fat;
  const carbs =
    (dayType === "training"
      ? settings?.training_carbs
      : settings?.rest_carbs) ?? fallback.carbs;

  return {
    protein,
    fat,
    carbs,
    kcal: calcKcalFromMacros(protein, fat, carbs),
  };
}
