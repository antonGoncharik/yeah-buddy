import type { DayWithMeals } from "@/lib/day/map";
import { isMealVisible, sumMeals } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

export function visibleMealsFromDay(shownDay: DayWithMeals | null) {
  if (!shownDay) {
    return [];
  }

  return shownDay.meals.filter((meal) =>
    isMealVisible(meal.meal_type, shownDay.is_training_day),
  );
}

export function factFromDay(shownDay: DayWithMeals | null) {
  if (!shownDay) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }
  return sumMeals(shownDay.meals);
}

export function hiddenMealKcalFromDay(shownDay: DayWithMeals | null) {
  if (!shownDay) {
    return 0;
  }
  return sumMeals(
    shownDay.meals.filter(
      (meal) =>
        !isMealVisible(meal.meal_type, shownDay.is_training_day) &&
        meal.items.length > 0,
    ),
  ).kcal;
}

export function hiddenMealTypesFromDay(
  shownDay: DayWithMeals | null,
): MealType[] {
  if (!shownDay) {
    return [];
  }
  return shownDay.meals
    .filter(
      (meal) =>
        !isMealVisible(meal.meal_type, shownDay.is_training_day) &&
        meal.items.length > 0,
    )
    .map((meal) => meal.meal_type);
}
