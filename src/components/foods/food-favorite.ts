import type { Dispatch, SetStateAction } from "react";

import { patchJson, peekJson, writeJson } from "@/lib/api-cache";
import { dismissFavoriteOffer } from "@/lib/food/favorite-offer";
import type { FoodListFilter } from "@/lib/food/schema";
import { parseFoodList } from "@/lib/foods";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";

export function foodsApiUrl(filter: FoodListFilter): string {
  return filter === "all" ? "/api/foods" : `/api/foods?filter=${filter}`;
}

export function writeFoodsList(filter: FoodListFilter, foods: Food[]): void {
  const url = foodsApiUrl(filter);
  const current = peekJson(url);
  const base = isRecord(current) ? current : {};
  writeJson(url, { ...base, foods });
}

const FOOD_LIST_FILTERS: FoodListFilter[] = ["all", "favorites", "recent"];

function patchCachedFoodLists(
  mutate: (foods: Food[], filter: FoodListFilter) => Food[] | null,
): void {
  for (const filter of FOOD_LIST_FILTERS) {
    const cached = peekJson(foodsApiUrl(filter));
    if (cached == null) {
      continue;
    }
    const foods = parseFoodList(cached);
    const next = mutate(foods, filter);
    if (next == null) {
      continue;
    }
    writeFoodsList(filter, next);
  }
}

export function syncSavedFoodInCache(food: Food): void {
  patchCachedFoodLists((foods, filter) => {
    const index = foods.findIndex((item) => item.id === food.id);
    if (filter === "favorites") {
      if (!food.is_favorite) {
        return index < 0 ? foods : foods.filter((item) => item.id !== food.id);
      }
      if (index >= 0) {
        return foods.map((item) => (item.id === food.id ? food : item));
      }
      return [food, ...foods];
    }
    if (index >= 0) {
      return foods.map((item) => (item.id === food.id ? food : item));
    }
    if (filter === "all" || filter === "recent") {
      return [food, ...foods];
    }
    return foods;
  });
}

export function removeFoodFromCache(foodId: string): void {
  patchCachedFoodLists((foods) => foods.filter((item) => item.id !== foodId));
}

export async function toggleFoodFavorite(
  food: Food,
  setFoods: Dispatch<SetStateAction<Food[]>>,
  listFilter: FoodListFilter,
): Promise<void> {
  const nextValue = !food.is_favorite;
  haptic("tick");

  setFoods((current) => {
    const next = current.map((item) =>
      item.id === food.id ? { ...item, is_favorite: nextValue } : item,
    );
    writeFoodsList(listFilter, next);
    return next;
  });

  try {
    await patchJson(`/api/foods/${food.id}/favorite`, {
      is_favorite: nextValue,
    });
    if (nextValue) {
      dismissFavoriteOffer(food.id);
    }
    if (listFilter === "favorites" && !nextValue) {
      setFoods((current) => {
        const next = current.filter((item) => item.id !== food.id);
        writeFoodsList("favorites", next);
        return next;
      });
    }
  } catch {
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === food.id ? { ...item, is_favorite: food.is_favorite } : item,
      );
      writeFoodsList(listFilter, next);
      return next;
    });
  }
}

export async function starFoodFromOffer(
  foodId: string,
  setFoods: Dispatch<SetStateAction<Food[]>>,
  listFilter: FoodListFilter,
): Promise<void> {
  setFoods((current) => {
    const next = current.map((item) =>
      item.id === foodId ? { ...item, is_favorite: true } : item,
    );
    writeFoodsList(listFilter, next);
    return next;
  });

  try {
    await patchJson(`/api/foods/${foodId}/favorite`, { is_favorite: true });
    dismissFavoriteOffer(foodId);
  } catch (error) {
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === foodId ? { ...item, is_favorite: false } : item,
      );
      writeFoodsList(listFilter, next);
      return next;
    });
    throw error;
  }
}
