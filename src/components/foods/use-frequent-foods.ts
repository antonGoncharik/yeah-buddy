"use client";

import { useEffect, useMemo, useState } from "react";

import { foodsApiUrl } from "@/components/foods/food-favorite";
import { fetchJson, peekJson } from "@/lib/api-cache";
import { frequentQuickAddFoods } from "@/lib/food/frequent-foods";
import { parseFoodList } from "@/lib/foods";
import type { Food } from "@/lib/types";

export function useFrequentFoods(limit = 10) {
  const [lists, setLists] = useState(readFoodLists);

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

  const foods = useMemo(
    () => frequentQuickAddFoods(lists.recent, lists.favorites, limit),
    [lists.favorites, lists.recent, limit],
  );

  return foods;
}

function readFoodLists(): { recent: Food[]; favorites: Food[] } {
  return {
    recent: parseFoodList(peekJson(foodsApiUrl("recent"))),
    favorites: parseFoodList(peekJson(foodsApiUrl("favorites"))),
  };
}
