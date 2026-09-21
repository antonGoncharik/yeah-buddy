"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addMealItemGrams } from "@/components/day/grams-save";
import { MealLumpLink, MealPlateLink } from "@/components/day/meal-item-row";
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
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { reportActionError } from "@/lib/action-error";
import { cachedGet } from "@/lib/api-cache";
import { foodSearchEmptyLine } from "@/lib/flavor";
import { foodMatchesQuery } from "@/lib/food/catalog-map";
import {
  type FavoriteOffer,
  readFavoriteOffers,
} from "@/lib/food/favorite-offer";
import { quickAddGrams } from "@/lib/food/quick-add";
import { parseFoodList, readStarterOnly } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "favorites" | "recent" | "all";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "favorites", label: "Избранное" },
  { id: "recent", label: "Недавние" },
  { id: "all", label: "Все" },
];

export function AddMealItemScreen({
  foodHrefBase,
  newFoodHref,
  lumpHrefBase,
  plateHref,
  quickAdd,
  startScan = false,
}: {
  foodHrefBase: string;
  newFoodHref: string;
  lumpHrefBase?: string;
  plateHref?: string;
  quickAdd?: {
    mealId: string;
    date: string;
    doneHref: string;
  };
  startScan?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("favorites");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [offers, setOffers] = useState<FavoriteOffer[]>([]);
  const [starring, setStarring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const loadedFilterRef = useRef<Filter | null>(null);
  const skippedEmptyFavorites = useRef(false);
  const favoriteOffer = useFavoriteOffer(offers);
  const [shopHits, setShopHits] = useState(false);
  const [starterOnly, setStarterOnly] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!startScan) {
      return;
    }
    const url = new URL(window.location.href);
    if (!url.searchParams.has("scan")) {
      return;
    }
    url.searchParams.delete("scan");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
  }, [startScan]);

  const load = useCallback(async (nextFilter: Filter, showLoading = false) => {
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
          const nextFoods = readFoods(data);
          lastCount = nextFoods.length;
          setFoods(nextFoods);
          setOffers(readFavoriteOffers(data));
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
      nextFilter === "favorites" &&
      lastCount === 0 &&
      !skippedEmptyFavorites.current
    ) {
      skippedEmptyFavorites.current = true;
      setFilter("recent");
      return;
    }
    setLoading(false);
  }, []);

  async function pickFood(food: Food) {
    const href = appendPathSegment(foodHrefBase, food.id);
    if (!quickAdd || addingId) {
      router.push(href);
      return;
    }

    const grams = quickAddGrams(food);
    if (grams == null) {
      router.push(href);
      return;
    }

    setAddingId(food.id);
    try {
      await addMealItemGrams({
        date: quickAdd.date,
        mealId: quickAdd.mealId,
        food,
        grams,
      });
      haptic("success");
      router.replace(quickAdd.doneHref);
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setAddingId(null);
    }
  }

  const search = query.trim();
  const listFilter = search ? "all" : filter;

  useEffect(() => {
    void load(listFilter);
  }, [listFilter, load]);

  const visibleFoods = useMemo(() => {
    if (!query.trim()) {
      return foods;
    }

    return foods.filter((food) =>
      foodMatchesQuery(food.name, food.brand, query),
    );
  }, [foods, query]);

  return (
    <>
      <div className="animate-rise flex flex-col gap-3 px-4">
        <FoodSearch
          value={query}
          onChange={setQuery}
          placeholder="Что съел"
          startScan={startScan}
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
                    void load("favorites", true);
                  }
                })
                .finally(() => setStarring(false));
            }}
            onDismiss={favoriteOffer.dismiss}
          />
        )}
        {lumpHrefBase ? (
          <MealLumpLink href={lumpHrefBase} query={query} />
        ) : null}
        {plateHref ? <MealPlateLink href={plateHref} /> : null}
      </div>

      <div
        className={
          search && lumpHrefBase
            ? "flex flex-col gap-4 px-4 pb-4"
            : "flex flex-col gap-4 px-4 pb-24"
        }
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError
            message={error}
            onRetry={() => void load(listFilter, true)}
          />
        ) : null}

        {!loading && !error && visibleFoods.length === 0 && !shopHits ? (
          <p className="py-10 text-center text-muted-foreground">
            {foodSearchEmptyLine(search, filter, Boolean(lumpHrefBase))}
          </p>
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            hrefForFood={(food) => appendPathSegment(foodHrefBase, food.id)}
            onSelectFood={quickAdd ? pickFood : undefined}
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
              void pickFood(food);
            }}
          />
        ) : null}
      </div>

      {search && lumpHrefBase ? null : (
        <StickyActions>
          <Link
            href={newFoodHref}
            className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
          >
            <Plus className="size-5" aria-hidden />
            Новый продукт
          </Link>
        </StickyActions>
      )}
    </>
  );
}

function appendPathSegment(href: string, segment: string): string {
  const queryAt = href.indexOf("?");
  if (queryAt < 0) {
    return `${href}/${segment}`;
  }

  return `${href.slice(0, queryAt)}/${segment}${href.slice(queryAt)}`;
}

function readFoods(data: unknown): Food[] {
  return parseFoodList(data);
}
