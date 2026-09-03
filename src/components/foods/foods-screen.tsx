"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FOODS_EMPTY, LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilter: Filter) => {
    setLoading(true);
    setError(null);

    try {
      const params =
        nextFilter === "all" ? "" : `?filter=${encodeURIComponent(nextFilter)}`;
      const response = await fetch(`/api/foods${params}`);
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setFoods(readFoods(data));
    } catch {
      setError(LOAD_FAILED);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

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
    setFoods((current) =>
      current.map((item) =>
        item.id === food.id ? { ...item, is_favorite: nextValue } : item,
      ),
    );

    try {
      const response = await fetch(`/api/foods/${food.id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: nextValue }),
      });

      if (!response.ok) {
        throw new Error("favorite failed");
      }

      if (filter === "favorites" && !nextValue) {
        setFoods((current) => current.filter((item) => item.id !== food.id));
      }
    } catch {
      setFoods((current) =>
        current.map((item) =>
          item.id === food.id
            ? { ...item, is_favorite: food.is_favorite }
            : item,
        ),
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Продукты" />

      <div className="flex flex-col gap-3 px-4">
        <FoodSearch value={query} onChange={setQuery} />

        <Segmented value={filter} options={FILTERS} onChange={setFilter} />
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load(filter)}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && visibleFoods.length === 0 ? (
          <p className="py-12 text-center text-lg text-muted-foreground">
            {emptyMessage(filter, query)}
          </p>
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            onToggleFavorite={(food) => void onToggleFavorite(food)}
          />
        ) : null}
      </div>

      <div className="px-4">
        <Link
          href="/food/new"
          className={cn(buttonVariants(), "h-14 w-full text-lg")}
        >
          Добавить продукт
        </Link>
      </div>
    </div>
  );
}

function emptyMessage(filter: Filter, query: string): string {
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
  if (
    !data ||
    typeof data !== "object" ||
    !("foods" in data) ||
    !Array.isArray(data.foods)
  ) {
    return [];
  }

  return data.foods as Food[];
}
