import type { DayWithMeals } from "@/lib/day/map";
import { type RecipeLine, remainingFills } from "@/lib/day/remaining";
import { isMealVisible, sumMeals } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

function trainingFlag(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
): boolean {
  if (isTrainingDay !== undefined) {
    return isTrainingDay;
  }
  return shownDay?.is_training_day === true;
}

export function visibleMealsFromDay(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
) {
  if (!shownDay) {
    return [];
  }

  return shownDay.meals.filter((meal) =>
    isMealVisible(meal.meal_type, trainingFlag(shownDay, isTrainingDay)),
  );
}

export function factFromDay(shownDay: DayWithMeals | null) {
  if (!shownDay) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }
  return sumMeals(shownDay.meals);
}

export function hiddenMealKcalFromDay(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
) {
  if (!shownDay) {
    return 0;
  }
  const training = trainingFlag(shownDay, isTrainingDay);
  return sumMeals(
    shownDay.meals.filter(
      (meal) =>
        !isMealVisible(meal.meal_type, training) && meal.items.length > 0,
    ),
  ).kcal;
}

export function hiddenMealTypesFromDay(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
): MealType[] {
  if (!shownDay) {
    return [];
  }
  const training = trainingFlag(shownDay, isTrainingDay);
  return shownDay.meals
    .filter(
      (meal) =>
        !isMealVisible(meal.meal_type, training) && meal.items.length > 0,
    )
    .map((meal) => meal.meal_type);
}

export function remainingFromDay(
  shownDay: DayWithMeals | null,
  recipe: RecipeLine[],
  isTrainingDay?: boolean,
) {
  if (!shownDay) {
    return {
      mealTypes: new Set<MealType>(),
    };
  }

  const fills = remainingFills(
    recipe,
    shownDay.meals,
    trainingFlag(shownDay, isTrainingDay),
  );
  const mealTypes = new Set<MealType>();
  for (const fill of fills) {
    mealTypes.add(fill.mealType);
  }

  return { mealTypes };
}
