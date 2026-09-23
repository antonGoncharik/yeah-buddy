import type { DayWithMeals } from "@/lib/day/map";
import { getDayByDate } from "@/lib/day/store";
import {
  getActiveMealTemplate,
  replaceMealTemplateItems,
} from "@/lib/meal-templates";
import { DAY_TEMPLATE_EMPTY } from "@/lib/messages";
import { isMealVisible } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType, MealTemplateDetail } from "@/lib/types";

export class DayTemplateEmptyError extends Error {
  readonly code = "DAY_TEMPLATE_EMPTY";

  constructor(message = DAY_TEMPLATE_EMPTY) {
    super(message);
    this.name = "DayTemplateEmptyError";
  }
}

export async function saveDayAsMealTemplate(
  userId: string,
  dayId: string,
): Promise<{ template: MealTemplateDetail; replaced: boolean }> {
  const day = await loadDayById(userId, dayId);
  if (!day) {
    throw new Error("Day not found");
  }

  const dayType: DayType = day.is_training_day ? "training" : "rest";
  const previous = await getActiveMealTemplate(userId, dayType);
  const replaced = Boolean(previous && previous.items.length > 0);
  const items = templateItemsFromDay(day, dayType);
  if (items.length === 0) {
    throw new DayTemplateEmptyError();
  }

  const template = await replaceMealTemplateItems(userId, dayType, items);
  return { template, replaced };
}

export function templateItemsFromDay(
  day: DayWithMeals,
  dayType: DayType,
): Array<{
  mealType: DayWithMeals["meals"][number]["meal_type"];
  foodId: string;
  grams: number;
}> {
  const training = dayType === "training";
  const items: Array<{
    mealType: DayWithMeals["meals"][number]["meal_type"];
    foodId: string;
    grams: number;
  }> = [];

  for (const meal of day.meals) {
    if (!isMealVisible(meal.meal_type, training)) {
      continue;
    }
    for (const item of meal.items) {
      if (!item.food_id || !(item.grams > 0)) {
        continue;
      }
      items.push({
        mealType: meal.meal_type,
        foodId: item.food_id,
        grams: item.grams,
      });
    }
  }

  return items;
}

async function loadDayById(
  userId: string,
  dayId: string,
): Promise<DayWithMeals | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("date")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return getDayByDate(userId, String(result.data.date).slice(0, 10));
}
