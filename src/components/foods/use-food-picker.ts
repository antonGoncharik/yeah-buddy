"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { foodsApiUrl } from "@/components/foods/food-favorite";
import { useFavoriteOffer } from "@/components/foods/use-favorite-offer";
import { cachedGet } from "@/lib/api-cache";
import { foodMatchesQuery } from "@/lib/food/catalog-map";
import {
  type FavoriteOffer,
  readFavoriteOffers,
} from "@/lib/food/favorite-offer";
import type { FoodListFilterTab } from "@/lib/food/list-filters";
import { parseFoodList, readStarterOnly } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

export function useFoodPicker({
  showFavoriteOffer = false,
  skipEmptyFavorites = true,
}: {
  showFavoriteOffer?: boolean;
  /** Jump to «Недавние» when favorites tab is empty on first open. */
  skipEmptyFavorites?: boolean;
} = {}) {
  const [filter, setFilter] = useState<FoodListFilterTab>("recent");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [offers, setOffers] = useState<FavoriteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopHits, setShopHits] = useState(false);
  const [starterOnly, setStarterOnly] = useState(false);
  const requestIdRef = useRef(0);
  const loadedFilterRef = useRef<FoodListFilterTab | null>(null);
  const skippedEmptyFavorites = useRef(false);
  const favoriteOffer = useFavoriteOffer(showFavoriteOffer ? offers : []);

  const search = query.trim();
  const listFilter = search ? "all" : filter;

  const load = useCallback(
    async (nextFilter: FoodListFilterTab, showLoading = false) => {
      const requestId = ++requestIdRef.current;
      if (showLoading || loadedFilterRef.current !== nextFilter) {
        setLoading(true);
      }
      setError(null);

      let lastCount = 0;
      try {
        await cachedGet(
          foodsApiUrl(nextFilter),
          (data) => {
            if (requestId !== requestIdRef.current) {
              return true;
            }
            const nextFoods = parseFoodList(data);
            lastCount = nextFoods.length;
            setFoods(nextFoods);
            if (showFavoriteOffer) {
              setOffers(readFavoriteOffers(data));
            }
            setStarterOnly(readStarterOnly(data));
            loadedFilterRef.current = nextFilter;
            return true;
          },
          () => {
            if (requestId === requestIdRef.current) {
              setLoading(false);
            }
          },
        );
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError(LOAD_FAILED);
        setFoods([]);
        setStarterOnly(false);
        setLoading(false);
        return;
      }

      if (requestId !== requestIdRef.current) {
        return;
      }
      if (
        skipEmptyFavorites &&
        nextFilter === "favorites" &&
        lastCount === 0 &&
        !skippedEmptyFavorites.current
      ) {
        skippedEmptyFavorites.current = true;
        setFilter("recent");
        return;
      }
      setLoading(false);
    },
    [showFavoriteOffer, skipEmptyFavorites],
  );

  useEffect(() => {
    void load(listFilter);
  }, [listFilter, load]);

  const visibleFoods = useMemo(() => {
    if (!query.trim()) {
      return foods;
    }
    return foods.filter((food) =>
      foodMatchesQuery(food.name, food.brand, query, food.barcode),
    );
  }, [foods, query]);

  function setQueryAndResetCatalogHits(value: string) {
    setQuery(value);
    setShopHits(false);
  }

  return {
    filter,
    setFilter,
    query,
    setQuery,
    setQueryAndResetCatalogHits,
    foods,
    setFoods,
    loading,
    error,
    reload: (force = true) => void load(listFilter, force),
    listFilter,
    search,
    visibleFoods,
    shopHits,
    setShopHits,
    starterOnly,
    setStarterOnly,
    favoriteOffer,
  };
}
