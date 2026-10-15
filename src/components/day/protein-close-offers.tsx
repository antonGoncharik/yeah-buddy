"use client";

import { useEffect, useRef, useState } from "react";

import { addMealItemGrams } from "@/components/day/grams-save";
import { foodsApiUrl } from "@/components/foods/food-favorite";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { Button } from "@/components/ui/button";
import { fetchJson, peekJson } from "@/lib/api-cache";
import { readCachedDay } from "@/lib/day/cache";
import { parseFoodList } from "@/lib/food/map";
import { quickAddGrams } from "@/lib/food/quick-add";
import { formatGrams, formatKcal, getMealLabel } from "@/lib/nutrition";
import { closeDayCombo } from "@/lib/nutrition/close-day";
import { macroGapProteinOffers } from "@/lib/nutrition/macro-gap-hint";
import {
  type ProteinCloseCandidate,
  proteinCloseOffers,
} from "@/lib/nutrition/protein-close";
import { haptic } from "@/lib/telegram/haptic";
import type { Food, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProteinCloseOffers({
  date,
  meals = [],
  mealId,
  onMealId,
  remainingProtein,
  remainingFat,
  remainingCarbs,
  remainingKcal,
  busy,
  macroGap = false,
}: {
  date: string;
  meals?: ReadonlyArray<{ id: string; meal_type: MealType }>;
  mealId: string | null;
  onMealId?: (mealId: string) => void;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
  remainingKcal: number;
  busy: boolean;
  macroGap?: boolean;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const [lists, setLists] = useState(readFoodLists);
  const [addingId, setAddingId] = useState<string | null>(null);
  const addingRef = useRef(false);

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

  const targetMeal = meals.find((item) => item.id === mealId) ?? null;
  const logMealId = targetMeal?.id ?? mealId;

  if (!logMealId) {
    return null;
  }

  const budget = {
    remainingProtein,
    remainingFat,
    remainingCarbs,
    remainingKcal,
  };
  const pool = candidates(lists.recent, lists.favorites);
  const offers = macroGap
    ? macroGapProteinOffers(budget, pool)
    : proteinCloseOffers(budget, pool);
  const combo = closeDayCombo(budget, pool);
  if (offers.length === 0 && !combo) {
    return null;
  }

  const byId = new Map(
    [...lists.favorites, ...lists.recent].map((food) => [food.id, food]),
  );

  async function addPieces(
    pieces: ReadonlyArray<{ foodId: string; grams: number }>,
  ) {
    if (!logMealId || addingRef.current || pieces.length === 0) {
      return;
    }
    addingRef.current = true;
    setAddingId(pieces[0]?.foodId ?? "combo");
    let logged = 0;
    try {
      for (const piece of pieces) {
        const food = byId.get(piece.foodId);
        if (!food) {
          continue;
        }
        const before = loggedGrams(date, piece.foodId);
        await addMealItemGrams({
          date,
          mealId: logMealId,
          food,
          grams: piece.grams,
        });
        if (loggedGrams(date, piece.foodId) > before) {
          logged += 1;
        }
      }
      if (logged > 0) {
        haptic("commit");
      }
    } finally {
      addingRef.current = false;
      setAddingId(null);
    }
  }

  const meal = targetMeal ?? meals[0] ?? null;

  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
      <div className="flex items-center justify-between gap-2 px-1">
        <p
          className={cn(
            "font-medium text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {macroGap ? "Чем закрыть белок" : "Добить белок"}
        </p>
        {meal && meals.length > 1 && onMealId ? (
          <button
            type="button"
            className="min-h-11 shrink-0 px-2 text-sm font-medium text-foreground"
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
        ) : null}
      </div>
      {combo ? (
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "block h-auto w-full min-w-0 px-3 text-left font-medium leading-snug whitespace-normal",
            compact ? "min-h-10 py-2 text-sm" : "min-h-12 py-3 text-base",
          )}
          disabled={busy || addingId != null}
          onClick={() => void addPieces(combo.pieces)}
        >
          {combo.pieces
            .map((piece) => `${piece.name} ${formatGrams(piece.grams)} г`)
            .join(" + ")}
          {` · ${formatKcal(combo.kcal)} ккал`}
        </Button>
      ) : null}
      {offers.map((offer) => (
        <Button
          key={offer.foodId}
          type="button"
          variant="secondary"
          className={cn(
            "block h-auto w-full min-w-0 px-3 text-left font-medium leading-snug whitespace-normal",
            compact ? "min-h-10 py-2 text-sm" : "min-h-12 py-3 text-base",
          )}
          disabled={busy || addingId != null}
          onClick={() =>
            void addPieces([{ foodId: offer.foodId, grams: offer.grams }])
          }
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
