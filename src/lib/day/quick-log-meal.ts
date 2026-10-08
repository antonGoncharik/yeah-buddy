import { isTempId } from "@/lib/day/optimistic";
import { MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

type MealSlot = {
  id: string;
  meal_type: MealType;
  items: readonly unknown[];
};

/** Meal to target for one-tap logging from Today (empty slot first, then time of day). */
export function pickQuickLogMealId(
  meals: ReadonlyArray<MealSlot>,
  at = new Date(),
  hourOverride?: number,
): string | null {
  const live = meals.filter((meal) => !isTempId(meal.id));
  if (live.length === 0) {
    return null;
  }

  for (const mealType of MEAL_DISPLAY_ORDER) {
    const meal = live.find((entry) => entry.meal_type === mealType);
    if (meal && meal.items.length === 0) {
      return meal.id;
    }
  }

  const hour =
    hourOverride != null && Number.isFinite(hourOverride)
      ? hourOverride
      : at.getHours();
  const preferred = mealTypeForHour(hour);
  const match = live.find((meal) => meal.meal_type === preferred);
  if (match) {
    return match.id;
  }

  const lastType = MEAL_DISPLAY_ORDER[MEAL_DISPLAY_ORDER.length - 1];
  const fallback = live.find((meal) => meal.meal_type === lastType);
  return fallback?.id ?? live[live.length - 1]?.id ?? null;
}

function mealTypeForHour(hour: number): MealType {
  if (hour < 11) {
    return "breakfast";
  }
  if (hour < 15) {
    return "lunch";
  }
  if (hour < 17) {
    return "snack";
  }
  if (hour < 22) {
    return "dinner";
  }
  return "snack";
}
