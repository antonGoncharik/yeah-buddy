"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { daysUrl, readCachedDay } from "@/lib/day/cache";
import { shiftIsoDate } from "@/lib/day/dates";
import { readDay } from "@/lib/day/today-payload";
import {
  todayOtherMealChips,
  yesterdayMealChips,
} from "@/lib/food/meal-memory";
import type { Food, MealItem, MealType } from "@/lib/types";

type MemoryFood = Pick<
  Food,
  | "id"
  | "name"
  | "protein_per_100"
  | "fat_per_100"
  | "carbs_per_100"
  | "kcal_per_100"
>;

type Chip = MemoryFood & { grams: number; label: string };

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
  const [groups, setGroups] = useState<{ yesterday: Chip[]; today: Chip[] }>({
    yesterday: [],
    today: [],
  });

  useEffect(() => {
    let cancelled = false;
    const yesterday = shiftIsoDate(date, -1);
    const refresh = () => {
      if (!cancelled) {
        setGroups(chipsFor(date, mealId));
      }
    };
    refresh();
    void Promise.all([
      cachedGet(daysUrl(date), (data) => readDay(data) != null).catch(
        () => undefined,
      ),
      cachedGet(daysUrl(yesterday), (data) => readDay(data) != null).catch(
        () => undefined,
      ),
    ]).then(refresh);
    return () => {
      cancelled = true;
    };
  }, [date, mealId]);

  if (groups.yesterday.length === 0 && groups.today.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      <ChipGroup
        title="Вчера в этом приёме"
        chips={groups.yesterday}
        addingId={addingId}
        onPick={onPick}
      />
      <ChipGroup
        title="Сегодня в других приёмах"
        chips={groups.today}
        addingId={addingId}
        onPick={onPick}
      />
    </div>
  );
}

function ChipGroup({
  title,
  chips,
  addingId,
  onPick,
}: {
  title: string;
  chips: Chip[];
  addingId: string | null;
  onPick: (food: MemoryFood, grams: number) => void;
}) {
  if (chips.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {chips.map((chip) => (
        <Button
          key={`${title}-${chip.id}`}
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

function chipsFor(
  date: string,
  mealId: string,
): { yesterday: Chip[]; today: Chip[] } {
  const today = readCachedDay(date);
  const prior = readCachedDay(shiftIsoDate(date, -1));
  const meal = today?.meals.find((item) => item.id === mealId);
  if (!meal) {
    return { yesterday: [], today: [] };
  }
  const foods = new Map<string, MemoryFood>();
  for (const item of [...(today?.meals ?? []), ...(prior?.meals ?? [])].flatMap(
    (row) => row.items,
  )) {
    if (item.food_id) {
      foods.set(item.food_id, foodFromItem(item));
    }
  }
  return {
    yesterday: withFoods(
      yesterdayMealChips({
        mealType: meal.meal_type,
        todayFoodIds: foodIds(meal),
        yesterday: prior ? memoryItems(prior.meals) : [],
      }),
      foods,
    ),
    today: withFoods(
      todayOtherMealChips({
        mealType: meal.meal_type,
        today: memoryItems(today?.meals ?? []),
      }),
      foods,
    ),
  };
}

function memoryItems(
  meals: ReadonlyArray<{
    meal_type: MealType;
    items: ReadonlyArray<{
      food_id: string | null;
      name_snapshot: string;
      grams: number;
    }>;
  }>,
) {
  return meals.flatMap((row) =>
    row.items.map((item) => ({
      foodId: item.food_id,
      name: item.name_snapshot,
      grams: item.grams,
      mealType: row.meal_type,
    })),
  );
}

function foodIds(meal: { items: ReadonlyArray<{ food_id: string | null }> }) {
  return meal.items.flatMap((item) => (item.food_id ? [item.food_id] : []));
}

function withFoods(
  chips: Array<{ foodId: string; grams: number; label: string }>,
  foods: Map<string, MemoryFood>,
): Chip[] {
  return chips.flatMap((chip) => {
    const food = foods.get(chip.foodId);
    return food ? [{ ...food, grams: chip.grams, label: chip.label }] : [];
  });
}

function foodFromItem(item: MealItem): MemoryFood {
  return {
    id: item.food_id ?? "",
    name: item.name_snapshot,
    protein_per_100: item.per_100_snapshot.protein,
    fat_per_100: item.per_100_snapshot.fat,
    carbs_per_100: item.per_100_snapshot.carbs,
    kcal_per_100: item.per_100_snapshot.kcal,
  };
}
