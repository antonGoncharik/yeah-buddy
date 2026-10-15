"use client";

import { isTempId } from "@/lib/day/optimistic";
import { getMealLabel } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

export function MealMoveButtons({
  meals,
  currentMealId,
  itemId,
  disabled,
  onMove,
}: {
  meals: ReadonlyArray<{ id: string; meal_type: MealType }>;
  currentMealId: string;
  itemId: string;
  disabled: boolean;
  onMove: (mealId: string) => void;
}) {
  const others = meals.filter(
    (meal) => meal.id !== currentMealId && !isTempId(meal.id),
  );
  if (isTempId(itemId) || isTempId(currentMealId)) {
    return null;
  }
  if (others.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">Перенести</p>
      <div className="flex flex-wrap gap-2">
        {others.map((meal) => (
          <button
            key={meal.id}
            type="button"
            className="min-h-11 rounded-lg bg-muted/60 px-3 text-base font-medium disabled:opacity-50"
            disabled={disabled}
            onClick={() => onMove(meal.id)}
          >
            {getMealLabel(meal.meal_type)}
          </button>
        ))}
      </div>
    </div>
  );
}
