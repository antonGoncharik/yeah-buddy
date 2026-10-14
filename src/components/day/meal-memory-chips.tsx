"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { daysUrl } from "@/lib/day/cache";
import { shiftIsoDate } from "@/lib/day/dates";
import { readDay } from "@/lib/day/today-payload";
import { yesterdayMealChips } from "@/lib/food/meal-memory";
import type { Food } from "@/lib/types";

type MemoryFood = Pick<
  Food,
  | "id"
  | "name"
  | "protein_per_100"
  | "fat_per_100"
  | "carbs_per_100"
  | "kcal_per_100"
>;

export function MealMemoryChips({
  date,
  mealId,
  addingId,
  onPick,
}: {
  date: string;
  mealId: string;
  addingId: string | null;
  onPick: (food: MemoryFood, grams: number) => void;
}) {
  const [chips, setChips] = useState<
    Array<MemoryFood & { grams: number; label: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    const yesterday = shiftIsoDate(date, -1);
    void Promise.all([
      cachedGet(daysUrl(date), (data) => {
        remember(data);
        return true;
      }).catch(() => undefined),
      cachedGet(daysUrl(yesterday), (data) => {
        remember(data);
        return true;
      }).catch(() => undefined),
    ]).then(() => {
      if (cancelled) {
        return;
      }
      const today = readDay(peek(date));
      const prior = readDay(peek(yesterday));
      const meal = today?.meals.find((item) => item.id === mealId);
      if (!meal || !prior) {
        setChips([]);
        return;
      }
      const foods = new Map<string, MemoryFood>();
      for (const item of prior.meals.flatMap((row) => row.items)) {
        if (!item.food_id) {
          continue;
        }
        foods.set(item.food_id, foodFromItem(item));
      }
      const next = yesterdayMealChips({
        mealType: meal.meal_type,
        todayFoodIds: meal.items.flatMap((item) =>
          item.food_id ? [item.food_id] : [],
        ),
        yesterday: prior.meals.flatMap((row) =>
          row.items.map((item) => ({
            foodId: item.food_id,
            name: item.name_snapshot,
            grams: item.grams,
            mealType: row.meal_type,
          })),
        ),
      });
      setChips(
        next.flatMap((chip) => {
          const food = foods.get(chip.foodId);
          return food
            ? [{ ...food, grams: chip.grams, label: chip.label }]
            : [];
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [date, mealId]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      <p className="text-sm font-medium text-muted-foreground">
        Вчера в этом приёме
      </p>
      {chips.map((chip) => (
        <Button
          key={chip.id}
          type="button"
          variant="secondary"
          className="h-12 justify-start text-base"
          disabled={addingId != null}
          onClick={() => onPick(chip, chip.grams)}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}

const cached = new Map<string, unknown>();

function remember(data: unknown) {
  const day = readDay(data);
  if (day) {
    cached.set(day.date, data);
  }
}

function peek(date: string): unknown {
  return cached.get(date) ?? null;
}

function foodFromItem(item: {
  food_id: string | null;
  name_snapshot: string;
  per_100_snapshot: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
}): MemoryFood {
  return {
    id: item.food_id ?? "",
    name: item.name_snapshot,
    protein_per_100: item.per_100_snapshot.protein,
    fat_per_100: item.per_100_snapshot.fat,
    carbs_per_100: item.per_100_snapshot.carbs,
    kcal_per_100: item.per_100_snapshot.kcal,
  };
}
