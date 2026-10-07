"use client";

import { useEffect, useState } from "react";

import { addMealItemGrams } from "@/components/day/grams-save";
import { foodsApiUrl } from "@/components/foods/food-favorite";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { Button } from "@/components/ui/button";
import { fetchJson, peekJson } from "@/lib/api-cache";
import { readCachedDay } from "@/lib/day/cache";
import { parseFoodList } from "@/lib/food/map";
import { quickAddGrams } from "@/lib/food/quick-add";
import { formatGrams } from "@/lib/nutrition";
import {
  type ProteinCloseCandidate,
  proteinCloseOffers,
} from "@/lib/nutrition/protein-close";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProteinCloseOffers({
  date,
  mealId,
  remainingProtein,
  remainingFat,
  remainingCarbs,
  remainingKcal,
  busy,
}: {
  date: string;
  mealId: string | null;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
  remainingKcal: number;
  busy: boolean;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const [lists, setLists] = useState(readFoodLists);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let gone = false;
    void Promise.all([
      fetchJson(foodsApiUrl("recent")).catch(() => null),
      fetchJson(foodsApiUrl("favorites")).catch(() => null),
    ]).then(([recent, favorites]) => {
      if (gone) {
        return;
      }
      setLists({
        recent: recent == null ? readFoodLists().recent : parseFoodList(recent),
        favorites:
          favorites == null
            ? readFoodLists().favorites
            : parseFoodList(favorites),
      });
    });
    return () => {
      gone = true;
    };
  }, []);

  if (!mealId) {
    return null;
  }

  const offers = proteinCloseOffers(
    {
      remainingProtein,
      remainingFat,
      remainingCarbs,
      remainingKcal,
    },
    candidates(lists.recent, lists.favorites),
  );
  if (offers.length === 0) {
    return null;
  }

  const byId = new Map(
    [...lists.favorites, ...lists.recent].map((food) => [food.id, food]),
  );

  async function add(foodId: string, grams: number) {
    if (!mealId || addingId) {
      return;
    }
    const food = byId.get(foodId);
    if (!food) {
      return;
    }
    const before = loggedGrams(date, foodId);
    setAddingId(foodId);
    try {
      await addMealItemGrams({ date, mealId, food, grams });
      if (loggedGrams(date, foodId) > before) {
        haptic("commit");
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      <p
        className={cn(
          "px-1 font-medium text-muted-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        Добить белок
      </p>
      {offers.map((offer) => (
        <Button
          key={offer.foodId}
          type="button"
          variant="secondary"
          className={cn(
            "block h-auto w-full min-w-0 px-3 text-left font-medium leading-snug whitespace-normal",
            compact
              ? "min-h-10 py-2 text-sm"
              : "min-h-12 py-3 text-base",
          )}
          disabled={busy || addingId != null}
          onClick={() => void add(offer.foodId, offer.grams)}
        >
          {offer.name} · {formatGrams(offer.grams)} г
        </Button>
      ))}
    </div>
  );
}

function loggedGrams(date: string, foodId: string): number {
  const day = readCachedDay(date);
  if (!day) {
    return 0;
  }
  let grams = 0;
  for (const meal of day.meals) {
    for (const item of meal.items) {
      if (item.food_id === foodId) {
        grams += item.grams;
      }
    }
  }
  return grams;
}

function readFoodLists(): { recent: Food[]; favorites: Food[] } {
  return {
    recent: parseFoodList(peekJson(foodsApiUrl("recent"))),
    favorites: parseFoodList(peekJson(foodsApiUrl("favorites"))),
  };
}

function candidates(
  recent: Food[],
  favorites: Food[],
): ProteinCloseCandidate[] {
  const rank = new Map(recent.map((food, index) => [food.id, index]));
  const byId = new Map<string, Food>();
  for (const food of [...favorites, ...recent]) {
    byId.set(food.id, food);
  }
  return [...byId.values()].map((food) => ({
    id: food.id,
    name: food.name,
    proteinPer100: food.protein_per_100,
    fatPer100: food.fat_per_100,
    carbsPer100: food.carbs_per_100,
    kcalPer100: food.kcal_per_100,
    portionGrams: quickAddGrams(food),
    favorite: food.is_favorite,
    recentRank: rank.get(food.id) ?? null,
  }));
}
