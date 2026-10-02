"use client";

import { useEffect, useState } from "react";

import { addMealItemGrams } from "@/components/day/grams-save";
import { foodsApiUrl } from "@/components/foods/food-favorite";
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

export function ProteinCloseOffers({
  date,
  mealId,
  remainingProtein,
  busy,
}: {
  date: string;
  mealId: string | null;
  remainingProtein: number;
  busy: boolean;
}) {
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
    remainingProtein,
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
    <div className="flex flex-col gap-2">
      <p className="px-1 text-sm font-medium text-muted-foreground">
        Добить белок
      </p>
      {offers.map((offer) => (
        <Button
          key={offer.foodId}
          type="button"
          variant="secondary"
          className="block h-auto min-h-12 w-full min-w-0 px-4 py-3 text-left text-base font-medium leading-snug whitespace-normal"
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
    portionGrams: quickAddGrams(food),
    favorite: food.is_favorite,
    recentRank: rank.get(food.id) ?? null,
  }));
}
