import type { Dispatch, SetStateAction } from "react";

import { patchJson, writeJson } from "@/lib/api-cache";
import type { FoodListFilter } from "@/lib/food/schema";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";

export function foodsApiUrl(filter: FoodListFilter): string {
  return filter === "all" ? "/api/foods" : `/api/foods?filter=${filter}`;
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
    writeJson(foodsApiUrl(listFilter), { foods: next });
    return next;
  });

  try {
    await patchJson(`/api/foods/${food.id}/favorite`, {
      is_favorite: nextValue,
    });
    if (listFilter === "favorites" && !nextValue) {
      setFoods((current) => {
        const next = current.filter((item) => item.id !== food.id);
        writeJson(foodsApiUrl("favorites"), { foods: next });
        return next;
      });
    }
  } catch {
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === food.id ? { ...item, is_favorite: food.is_favorite } : item,
      );
      writeJson(foodsApiUrl(listFilter), { foods: next });
      return next;
    });
  }
}
