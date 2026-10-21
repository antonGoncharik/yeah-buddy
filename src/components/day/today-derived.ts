import type { DayWithMeals } from "@/lib/day/map";
import { type RecipeLine, remainingFills } from "@/lib/day/remaining";
import { getMealOrder, isMealVisible, sumMeals } from "@/lib/nutrition";
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

  const training = trainingFlag(shownDay, isTrainingDay);
  return shownDay.meals
    .filter(
      (meal) =>
        meal.items.length > 0 || isMealVisible(meal.meal_type, training),
    )
    .sort(
      (left, right) =>
        getMealOrder(left.meal_type) - getMealOrder(right.meal_type),
    );
}

export function factFromDay(shownDay: DayWithMeals | null) {
  if (!shownDay) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }
  return sumMeals(shownDay.meals);
}

function filledMealsOffScreen(shownDay: DayWithMeals, isTrainingDay?: boolean) {
  const shown = new Set(
    visibleMealsFromDay(shownDay, isTrainingDay).map((meal) => meal.meal_type),
  );
  return shownDay.meals.filter(
    (meal) => meal.items.length > 0 && !shown.has(meal.meal_type),
  );
}

export function hiddenMealKcalFromDay(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
) {
  if (!shownDay) {
    return 0;
  }
  return sumMeals(filledMealsOffScreen(shownDay, isTrainingDay)).kcal;
}

export function hiddenMealTypesFromDay(
  shownDay: DayWithMeals | null,
  isTrainingDay?: boolean,
): MealType[] {
  if (!shownDay) {
    return [];
  }
  return filledMealsOffScreen(shownDay, isTrainingDay).map(
    (meal) => meal.meal_type,
  );
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
