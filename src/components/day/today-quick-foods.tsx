"use client";

import { useState } from "react";

import { addMealItemGrams } from "@/components/day/grams-save";
import { FrequentFoodChips } from "@/components/foods/frequent-food-chips";
import { useFrequentFoods } from "@/components/foods/use-frequent-foods";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { reportActionError } from "@/lib/action-error";
import { quickAddGrams } from "@/lib/food/quick-add";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TodayQuickFoods({
  date,
  mealId,
  busy,
}: {
  date: string;
  mealId: string;
  busy: boolean;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const foods = useFrequentFoods(8);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function pick(food: Food) {
    if (addingId) {
      return;
    }
    const grams = quickAddGrams(food);
    if (grams == null) {
      return;
    }
    setAddingId(food.id);
    try {
      await addMealItemGrams({ date, mealId, food, grams });
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
