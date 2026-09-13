import { getTargets, writeTemplateItems } from "@/lib/day/create";
import { isWritableDayDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { mealsMatchRecipe, recipeFromTemplate } from "@/lib/day/remaining";
import { getDayByDate } from "@/lib/day/store";
import {
  assertUserDayWritable,
  getUserCalendarToday,
} from "@/lib/day/writable";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType, MealType } from "@/lib/types";

export async function setDayType(
  userId: string,
  dayId: string,
  dayType: DayType,
): Promise<DayWithMeals> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("days")
    .select("date")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    throw new Error("Day not found");
  }

  const date = String(existing.data.date).slice(0, 10);
  await assertUserDayWritable(userId, date);

  const current = await getDayByDate(userId, date);
  if (!current) {
    throw new Error("Day not found");
  }

  if (current.is_training_day === (dayType === "training")) {
    return current;
  }

  const oldType: DayType = current.is_training_day ? "training" : "rest";
  const oldTemplate = await getActiveMealTemplate(userId, oldType);
  const swapMeals = mealsMatchRecipe(
    current.meals,
    recipeFromTemplate(oldTemplate),
  );

  const targets = await getTargets(userId, dayType);
  const updated = await supabase
    .from("days")
    .update({
      is_training_day: dayType === "training",
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .eq("id", dayId)
    .eq("user_id", userId)
    .select("date")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Day not found");
  }

  if (swapMeals) {
    await replaceMealsFromTemplate(userId, current, dayType);
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function markDateAsTrainingIfExists(
  userId: string,
  date: string,
): Promise<void> {
  const today = await getUserCalendarToday(userId);
  if (!isWritableDayDate(date, today)) {
    return;
  }

  const day = await getDayByDate(userId, date);
  if (!day || day.is_training_day) {
    return;
  }

  await setDayType(userId, day.id, "training");
}

async function replaceMealsFromTemplate(
  userId: string,
  day: DayWithMeals,
  dayType: DayType,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const mealIds = new Map<MealType, string>();
  for (const meal of day.meals) {
    mealIds.set(meal.meal_type, meal.id);
  }

  const ids = [...mealIds.values()];
  if (ids.length > 0) {
    const deleted = await supabase
      .from("meal_items")
      .delete()
      .in("meal_id", ids)
      .eq("user_id", userId);
    if (deleted.error) {
      throw deleted.error;
    }
  }

  await writeTemplateItems(
    supabase,
    userId,
    mealIds,
    await getActiveMealTemplate(userId, dayType),
  );
}
