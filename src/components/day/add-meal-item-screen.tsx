"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MealLumpLink, MealPlateLink } from "@/components/day/meal-item-row";
import {
  CatalogFoodSection,
  catalogSearchActive,
} from "@/components/foods/catalog-food-section";
import { toggleFoodFavorite } from "@/components/foods/food-favorite";
import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { foodSearchEmptyLine } from "@/lib/flavor";
import { parseFoodList } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
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
}: {
  foodHrefBase: string;
  newFoodHref: string;
  lumpHrefBase?: string;
  plateHref?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("favorites");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const loadedFilterRef = useRef<Filter | null>(null);

  const load = useCallback(async (nextFilter: Filter, showLoading = false) => {
    const requestId = ++requestIdRef.current;
    if (showLoading || loadedFilterRef.current !== nextFilter) {
      setLoading(true);
    }
    setError(null);

    try {
      const params =
        nextFilter === "all" ? "" : `?filter=${encodeURIComponent(nextFilter)}`;
      const response = await fetch(`/api/foods${params}`);
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setFoods(readFoods(data));
      loadedFilterRef.current = nextFilter;
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(LOAD_FAILED);
      setFoods([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const search = query.trim();
  const listFilter = search ? "all" : filter;

  useEffect(() => {
    void load(listFilter);
  }, [listFilter, load]);

  const visibleFoods = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return foods;
    }

    return foods.filter((food) => {
      const haystack = `${food.name} ${food.brand ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [foods, query]);

  return (
    <>
      <div className="animate-rise flex flex-col gap-3 px-4">
        <FoodSearch value={query} onChange={setQuery} placeholder="Что съел" />

        {search ? null : (
          <Segmented value={filter} options={FILTERS} onChange={setFilter} />
        )}
        {lumpHrefBase ? (
          <MealLumpLink href={lumpHrefBase} query={query} />
        ) : null}
        {plateHref && !search ? <MealPlateLink href={plateHref} /> : null}
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

        {!loading &&
        !error &&
        visibleFoods.length === 0 &&
        !catalogSearchActive(query) ? (
          <p className="py-10 text-center text-muted-foreground">
            {foodSearchEmptyLine(search, filter, Boolean(lumpHrefBase))}
          </p>
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            hrefForFood={(food) => appendPathSegment(foodHrefBase, food.id)}
            onToggleFavorite={(food) =>
              void toggleFoodFavorite(food, setFoods, listFilter)
            }
          />
        ) : null}

        {!loading && !error ? (
          <CatalogFoodSection
            query={query}
            emptyLabel={
              visibleFoods.length === 0
                ? foodSearchEmptyLine(search, filter, Boolean(lumpHrefBase))
                : undefined
            }
            onAdded={(food) => {
              router.push(appendPathSegment(foodHrefBase, food.id));
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
