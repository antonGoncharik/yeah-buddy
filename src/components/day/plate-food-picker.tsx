"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CatalogFoodSection } from "@/components/foods/catalog-food-section";
import { FavoriteOfferCard } from "@/components/foods/favorite-offer-card";
import {
  foodsApiUrl,
  starFoodFromOffer,
  toggleFoodFavorite,
} from "@/components/foods/food-favorite";
import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { StarterCatalogNote } from "@/components/foods/starter-catalog-note";
import { useFavoriteOffer } from "@/components/foods/use-favorite-offer";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { foodSearchEmptyLine } from "@/lib/flavor";
import { foodMatchesQuery } from "@/lib/food/catalog-map";
import {
  type FavoriteOffer,
  readFavoriteOffers,
} from "@/lib/food/favorite-offer";
import { parseFoodList, readStarterOnly } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

type Filter = "favorites" | "recent" | "all";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "favorites", label: "Избранное" },
  { id: "recent", label: "Недавние" },
  { id: "all", label: "Все" },
];

export function PlateFoodPicker({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (food: Food) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("favorites");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [offers, setOffers] = useState<FavoriteOffer[]>([]);
  const [starring, setStarring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const skippedEmptyFavorites = useRef(false);
  const favoriteOffer = useFavoriteOffer(offers);
  const search = query.trim();
  const listFilter = search ? "all" : filter;
  const [shopHits, setShopHits] = useState(false);
  const [starterOnly, setStarterOnly] = useState(false);

  const load = useCallback(async (nextFilter: Filter) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    let switched = false;
    try {
      const response = await fetch(foodsApiUrl(nextFilter));
      if (!response.ok) {
        throw new Error("load failed");
      }
      const data: unknown = await response.json();
      if (requestId !== requestIdRef.current) {
        return;
      }
      const nextFoods = parseFoodList(data);
      setFoods(nextFoods);
      setOffers(readFavoriteOffers(data));
      setStarterOnly(readStarterOnly(data));
      if (
        nextFilter === "favorites" &&
        nextFoods.length === 0 &&
        !skippedEmptyFavorites.current
      ) {
        skippedEmptyFavorites.current = true;
        switched = true;
        setFilter("recent");
        return;
      }
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(LOAD_FAILED);
      setFoods([]);
      setStarterOnly(false);
    } finally {
      if (requestId === requestIdRef.current && !switched) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(listFilter);
  }, [listFilter, load]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const visibleFoods = useMemo(() => {
    if (!query.trim()) {
      return foods;
    }
    return foods.filter((food) =>
      foodMatchesQuery(food.name, food.brand, query),
    );
  }, [foods, query]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="text-xl font-semibold tracking-tight">{title}</p>
        <FoodSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setShopHits(false);
          }}
        />
        {search || !starterOnly ? null : <StarterCatalogNote />}
        {search ? null : (
          <Segmented value={filter} options={FILTERS} onChange={setFilter} />
        )}
        {search || !favoriteOffer.offer ? null : (
          <FavoriteOfferCard
            offer={favoriteOffer.offer}
            busy={starring}
            onAccept={() => {
              const target = favoriteOffer.offer;
              if (!target) {
                return;
              }
              setStarring(true);
              void starFoodFromOffer(target.foodId, setFoods, listFilter)
                .then(() => {
                  favoriteOffer.dismiss();
                  if (listFilter === "favorites") {
                    void load("favorites");
                  }
                })
                .finally(() => setStarring(false));
            }}
            onDismiss={favoriteOffer.dismiss}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-4">
          {loading ? <ScreenLoading /> : null}

          {!loading && error ? (
            <ScreenError
              message={error}
              onRetry={() => void load(listFilter)}
            />
          ) : null}

          {!loading && !error && visibleFoods.length === 0 && !shopHits ? (
            <p className="py-10 text-center text-muted-foreground">
              {foodSearchEmptyLine(query, filter)}
            </p>
          ) : null}

          {!loading && !error && visibleFoods.length > 0 ? (
            <FoodList
              foods={visibleFoods}
              onSelectFood={onPick}
              onToggleFavorite={(food) =>
                void toggleFoodFavorite(food, setFoods, listFilter).then(() =>
                  favoriteOffer.refresh(),
                )
              }
            />
          ) : null}

          {!loading && !error ? (
            <CatalogFoodSection
              query={query}
              onHits={setShopHits}
              onAdded={(food) => {
                setStarterOnly(false);
                onPick(food);
              }}
            />
          ) : null}
        </div>
      </div>

      <StickyActions overlay={false} withNav={false}>
        <div data-keyboard-secondary>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            onClick={onClose}
          >
            Отмена
          </Button>
        </div>
      </StickyActions>
    </div>
  );
}
