"use client";

import { MealCard } from "@/components/day/meal-card";
import { withDateQuery } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import type {
  CopyDayHint,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";

export function TodayDayMeals({
  date,
  today,
  viewOnly,
  visibleMeals,
  remainingMealTypes,
  copyDays,
  namedMeals,
  busy,
  fillMealFromTemplate,
  copyMealFromDate,
  applyNamedMeal,
  saveNamedMeal,
  deleteNamedMeal,
  deleteItem,
}: {
  date: string;
  today: string;
  viewOnly: boolean;
  visibleMeals: DayWithMeals["meals"];
  remainingMealTypes: ReadonlySet<MealType>;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  busy: boolean;
  fillMealFromTemplate: (mealId: string) => Promise<void>;
  copyMealFromDate: (
    mealId: string,
    mealType: MealType,
    sourceDate: string,
  ) => Promise<void>;
  applyNamedMeal: (
    mealId: string,
    mealType: MealType,
    namedMealId: string,
  ) => Promise<void>;
  saveNamedMeal: (mealId: string, mealType: MealType) => Promise<void>;
  deleteNamedMeal: (namedMealId: string, name: string) => Promise<void>;
  deleteItem: (item: MealItem) => Promise<void>;
}) {
  return (
    <>
      {visibleMeals.map((meal, index) => (
        <MealCard
          key={meal.id}
          mealType={meal.meal_type}
          items={meal.items.map((item) => ({
            id: item.id,
            name: item.name_snapshot,
            grams: item.grams,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            kcal: item.kcal,
          }))}
          itemHref={
            viewOnly
              ? undefined
              : (item) => withDateQuery(`/today/items/${item.id}`, date, today)
          }
          addHref={
            viewOnly
              ? undefined
              : withDateQuery(`/today/meals/${meal.id}/add`, date, today)
          }
          plateHref={
            viewOnly
              ? undefined
              : withDateQuery(`/today/meals/${meal.id}/plate`, date, today)
          }
          date={date}
          copyDays={copyDays}
          namedMeals={namedMeals}
          onCopyDate={
            viewOnly
              ? undefined
              : (sourceDate) =>
                  void copyMealFromDate(meal.id, meal.meal_type, sourceDate)
          }
          onApplyNamed={
            viewOnly
              ? undefined
              : (namedMealId) =>
                  void applyNamedMeal(meal.id, meal.meal_type, namedMealId)
          }
          onSaveNamed={
            viewOnly
              ? undefined
              : () => void saveNamedMeal(meal.id, meal.meal_type)
          }
          onDeleteNamed={
            viewOnly
              ? undefined
              : (namedMealId, name) => void deleteNamedMeal(namedMealId, name)
          }
          onFillTemplate={
            viewOnly || !remainingMealTypes.has(meal.meal_type)
              ? undefined
              : () => void fillMealFromTemplate(meal.id)
          }
          copyBusy={busy}
          readOnly={viewOnly}
          className="animate-rise"
          style={{ animationDelay: `${80 + index * 50}ms` }}
          onDeleteItem={
            viewOnly
              ? undefined
              : (item) => {
                  const row = meal.items.find((entry) => entry.id === item.id);
                  if (row) {
                    void deleteItem(row);
                  }
                }
          }
        />
      ))}
    </>
  );
}
