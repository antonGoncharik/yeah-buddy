"use client";

import { type ReactNode, useEffect, useState } from "react";

import { CatalogFoodSection } from "@/components/foods/catalog-food-section";
import { FavoriteOfferCard } from "@/components/foods/favorite-offer-card";
import {
  starFoodFromOffer,
  toggleFoodFavorite,
} from "@/components/foods/food-favorite";
import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { StarterCatalogNote } from "@/components/foods/starter-catalog-note";
import { useFoodPicker } from "@/components/foods/use-food-picker";
import { ProductDoodle } from "@/components/layout/doodles";
import { EmptyNote, EmptyNoteCompact } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Segmented } from "@/components/ui/segmented";
import { foodSearchEmptyLine } from "@/lib/flavor";
import { ownsBarcode } from "@/lib/food/catalog-map";
import { FOOD_LIST_FILTER_TABS } from "@/lib/food/list-filters";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FoodPicker({
  searchPlaceholder = "Поиск продукта",
  startScan = false,
  showFavoriteOffer = false,
  skipEmptyFavorites = true,
  lumpEmptyHint = false,
  topSlot,
  hrefForFood,
  onSelectFood,
  onCatalogAdded,
  stickyActions,
  hideStickyActions = false,
  stickyHideWhenSearch = false,
  listClassName,
  wrapperClassName,
  onScanConsumed,
}: {
  searchPlaceholder?: string;
  startScan?: boolean;
  showFavoriteOffer?: boolean;
  skipEmptyFavorites?: boolean;
  lumpEmptyHint?: boolean;
  topSlot?: ReactNode;
  hrefForFood?: (food: Food) => string;
  onSelectFood?: (food: Food) => void;
  onCatalogAdded?: (food: Food, foods: Food[]) => void;
  stickyActions?: ReactNode;
  hideStickyActions?: boolean;
  /** Hide sticky actions and tighten list padding while the search field has text. */
  stickyHideWhenSearch?: boolean;
  listClassName?: string;
  wrapperClassName?: string;
  onScanConsumed?: () => void;
}) {
  const picker = useFoodPicker({ showFavoriteOffer, skipEmptyFavorites });
  const [starring, setStarring] = useState(false);

  useEffect(() => {
    if (!startScan) {
      return;
    }
    onScanConsumed?.();
  }, [onScanConsumed, startScan]);

  const {
    filter,
    setFilter,
    query,
    setQuery,
    foods,
    setFoods,
    loading,
    error,
    reload,
    listFilter,
    search,
    visibleFoods,
    shopHits,
    setShopHits,
    starterOnly,
    setStarterOnly,
    favoriteOffer,
  } = picker;

  const effectiveHideSticky =
    hideStickyActions || (stickyHideWhenSearch && Boolean(search));

  const body = (
    <>
      <div className="animate-rise flex flex-col gap-3 px-4">
        <FoodSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setShopHits(false);
          }}
          placeholder={searchPlaceholder}
          startScan={startScan}
        />

        {search || !starterOnly ? null : <StarterCatalogNote />}

        {search ? null : (
          <Segmented
            value={filter}
            options={FOOD_LIST_FILTER_TABS}
            onChange={setFilter}
          />
        )}

        {showFavoriteOffer && !search && favoriteOffer.offer ? (
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
                    reload(true);
                  }
                })
                .finally(() => setStarring(false));
            }}
            onDismiss={favoriteOffer.dismiss}
          />
        ) : null}

        {topSlot}
      </div>

      <div
        className={cn(
          "flex flex-col px-4",
          search ? "gap-2" : "gap-4",
          effectiveHideSticky ? "pb-4" : listClassName,
        )}
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => reload(true)} />
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            wrapNames
            hrefForFood={hrefForFood}
            onSelectFood={onSelectFood}
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
            barcodeTaken={ownsBarcode(foods, query)}
            onHits={setShopHits}
            onAdded={(food) => {
              setStarterOnly(false);
              setFoods((current) => {
                const next = [
                  food,
                  ...current.filter((item) => item.id !== food.id),
                ];
                onCatalogAdded?.(food, next);
                return next;
              });
            }}
          />
        ) : null}

        {!loading && !error && visibleFoods.length === 0 && !shopHits ? (
          search ? (
            <EmptyNoteCompact
              title={foodSearchEmptyLine(search, filter, lumpEmptyHint)}
            />
          ) : (
            <EmptyNote
              icon={<ProductDoodle className="size-6" />}
              title={foodSearchEmptyLine(search, filter, lumpEmptyHint)}
            />
          )
        ) : null}
      </div>

      {effectiveHideSticky || !stickyActions ? null : stickyActions}
    </>
  );

  if (!wrapperClassName) {
    return body;
  }

  return <div className={wrapperClassName}>{body}</div>;
}
