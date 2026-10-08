import { createDayFromTemplate } from "@/lib/day/create";
import { DayConflictError, PastDayLockedError } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { pickQuickLogMealId } from "@/lib/day/quick-log-meal";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { isMealVisible } from "@/lib/nutrition";
import { localClock } from "@/lib/telegram/reminder-clock";
import type { MealType } from "@/lib/types";

export async function resolveMealChatTarget(
  userId: string,
  timeZone: string,
  now = new Date(),
): Promise<
  | { ok: true; date: string; mealId: string; mealType: MealType }
  | { ok: false; reason: "locked" | "no_meal" }
> {
  const { date, hour } = localClock(now, timeZone);

  try {
    await assertUserDayWritable(userId, date);
  } catch (error) {
    if (error instanceof PastDayLockedError) {
      return { ok: false, reason: "locked" };
    }
    throw error;
  }

  const day = await ensureDay(userId, date);
  const visible = day.meals.filter((meal) =>
    isMealVisible(meal.meal_type, day.is_training_day),
  );
  const mealId = pickQuickLogMealId(visible, now, hour);
  if (!mealId) {
    return { ok: false, reason: "no_meal" };
  }

  const meal = visible.find((entry) => entry.id === mealId);
  if (!meal) {
    return { ok: false, reason: "no_meal" };
  }

  return { ok: true, date, mealId, mealType: meal.meal_type };
}

async function ensureDay(userId: string, date: string): Promise<DayWithMeals> {
  const existing = await getDayByDate(userId, date);
  if (existing) {
    return existing;
  }

  try {
    return await createDayFromTemplate(userId, date, "rest");
  } catch (error) {
    if (error instanceof DayConflictError) {
      const raced = await getDayByDate(userId, date);
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}
