"use client";

import { useState } from "react";

import { addMealItemGrams } from "@/components/day/grams-save";
import { FrequentFoodChips } from "@/components/foods/frequent-food-chips";
import { useFrequentFoods } from "@/components/foods/use-frequent-foods";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { reportActionError } from "@/lib/action-error";
import { quickAddGrams } from "@/lib/food/quick-add";
import { LOAD_FAILED } from "@/lib/messages";
import { getMealLabel } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { Food, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TodayQuickFoods({
  date,
  meals,
  mealId,
  onMealId,
  busy,
}: {
  date: string;
  meals: ReadonlyArray<{ id: string; meal_type: MealType }>;
  mealId: string;
  onMealId: (mealId: string) => void;
  busy: boolean;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const foods = useFrequentFoods(8);
  const [addingId, setAddingId] = useState<string | null>(null);
  const meal = meals.find((item) => item.id === mealId) ?? meals[0];

  async function pick(food: Food) {
    if (addingId) {
      return;
    }
    const grams = quickAddGrams(food);
    if (grams == null || !meal) {
      return;
    }
    setAddingId(food.id);
    try {
      await addMealItemGrams({ date, mealId: meal.id, food, grams });
      haptic("commit");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setAddingId(null);
    }
  }

  if (foods.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-rise flex flex-col",
        compact ? "gap-1.5" : "gap-2",
      )}
    >
      <p
        className={cn(
          "px-1 font-medium text-muted-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        Частые
        {meal && meals.length > 1 ? (
          <>
            {" · "}
            <button
              type="button"
              className="min-h-11 font-medium text-foreground"
              onClick={() => {
                const index = meals.findIndex((item) => item.id === meal.id);
                const next = meals[(index + 1) % meals.length];
                if (next) {
                  haptic("tick");
                  onMealId(next.id);
                }
              }}
            >
              в {getMealLabel(meal.meal_type)}
            </button>
          </>
        ) : null}
      </p>
      <FrequentFoodChips
        foods={foods}
        busy={busy}
        addingId={addingId}
        onPick={(food) => void pick(food)}
      />
    </div>
  );
}
