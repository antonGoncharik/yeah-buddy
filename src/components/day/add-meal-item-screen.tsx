"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MealLumpLink, MealPlateLink } from "@/components/day/meal-item-row";
import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { foodSearchEasterEgg } from "@/lib/flavor";
import { parseFoodList } from "@/lib/foods";
import { FOODS_EMPTY, LOAD_FAILED } from "@/lib/messages";
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

      <div className={search && lumpHrefBase ? "px-4 pb-4" : "px-4 pb-24"}>
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load(listFilter, true)}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && visibleFoods.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {emptyMessage(filter, search, Boolean(lumpHrefBase))}
          </p>
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            showFavorite={false}
            hrefForFood={(food) => appendPathSegment(foodHrefBase, food.id)}
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

function emptyMessage(filter: Filter, query: string, canLump: boolean): string {
  const easter = foodSearchEasterEgg(query);
  if (easter) {
    return easter;
  }
  if (query) {
    return canLump
      ? "Нет в списке — запиши порцию сверху."
      : "Ничего не найдено.";
  }

  if (filter === "favorites") {
    return "Нет избранных продуктов.";
  }

  if (filter === "recent") {
    return "Недавних продуктов пока нет.";
  }

  return FOODS_EMPTY;
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
