"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CatalogFoodSection,
  catalogSearchActive,
} from "@/components/foods/catalog-food-section";
import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { AppHeader } from "@/components/layout/app-header";
import { CookieDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { foodSearchEasterEgg } from "@/lib/flavor";
import { parseFoodList } from "@/lib/foods";
import { FOODS_EMPTY, LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "recent";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "favorites", label: "Избранное" },
  { id: "recent", label: "Недавние" },
];

export function FoodsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const { loading, begin, done, reset } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const search = query.trim();
  const listFilter = search ? "all" : filter;

  const load = useCallback(
    async (nextFilter: Filter) => {
      begin();
      setError(null);

      try {
        const params =
          nextFilter === "all"
            ? ""
            : `?filter=${encodeURIComponent(nextFilter)}`;
        await cachedGet(
          `/api/foods${params}`,
          (data) => {
            setFoods(readFoods(data));
            return true;
          },
          () => done(true),
        );
        done(true);
      } catch {
        setError(LOAD_FAILED);
        setFoods([]);
        done(false);
      }
    },
    [begin, done],
  );

  useEffect(() => {
    reset();
    void load(filter);
  }, [filter, load, reset]);

  useEffect(() => {
    if (listFilter !== filter) {
      void load(listFilter);
    }
  }, [filter, listFilter, load]);

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

  async function onToggleFavorite(food: Food) {
    const nextValue = !food.is_favorite;
    setFoods((current) => {
      const next = current.map((item) =>
        item.id === food.id ? { ...item, is_favorite: nextValue } : item,
      );
      writeJson(foodsUrl(listFilter), { foods: next });
      return next;
    });

    try {
      await patchJson(`/api/foods/${food.id}/favorite`, {
        is_favorite: nextValue,
      });

      if (filter === "favorites" && !nextValue) {
        setFoods((current) => {
          const next = current.filter((item) => item.id !== food.id);
          writeJson(foodsUrl("favorites"), { foods: next });
          return next;
        });
      }
    } catch {
      setFoods((current) => {
        const next = current.map((item) =>
          item.id === food.id
            ? { ...item, is_favorite: food.is_favorite }
            : item,
        );
        writeJson(foodsUrl(listFilter), { foods: next });
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Продукты" backHref="/settings" />

      <div className="animate-rise flex flex-col gap-3 px-4">
        <FoodSearch value={query} onChange={setQuery} />

        {search ? null : (
          <Segmented value={filter} options={FILTERS} onChange={setFilter} />
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load(listFilter)} />
        ) : null}

        {!loading &&
        !error &&
        visibleFoods.length === 0 &&
        !catalogSearchActive(query) ? (
          <EmptyNote
            icon={<CookieDoodle className="size-6" />}
            title={emptyMessage(filter, query)}
          />
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            onToggleFavorite={(food) => void onToggleFavorite(food)}
          />
        ) : null}

        {!loading && !error ? (
          <CatalogFoodSection
            query={query}
            emptyLabel={
              visibleFoods.length === 0
                ? emptyMessage(filter, query)
                : undefined
            }
            onAdded={(food) => {
              setFoods((current) => {
                const next = [
                  food,
                  ...current.filter((item) => item.id !== food.id),
                ];
                writeJson("/api/foods", { foods: next });
                return next;
              });
            }}
          />
        ) : null}
      </div>

      <StickyActions>
        <Link
          href="/food/new"
          className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
        >
          <Plus className="size-5" aria-hidden />
          Новый продукт
        </Link>
      </StickyActions>
    </div>
  );
}

function emptyMessage(filter: Filter, query: string): string {
  const easter = foodSearchEasterEgg(query);
  if (easter) {
    return easter;
  }
  if (query.trim()) {
    return "Ничего не найдено.";
  }

  if (filter === "favorites") {
    return "Нет избранных продуктов.";
  }

  if (filter === "recent") {
    return "Недавних продуктов пока нет.";
  }

  return FOODS_EMPTY;
}

function readFoods(data: unknown): Food[] {
  return parseFoodList(data);
}

function foodsUrl(filter: Filter): string {
  return filter === "all" ? "/api/foods" : `/api/foods?filter=${filter}`;
}
