"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FoodList } from "@/components/foods/food-list";
import { FoodSearch } from "@/components/foods/food-search";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { foodSearchEasterEgg } from "@/lib/flavor";
import { parseFoodList } from "@/lib/foods";
import { FOODS_EMPTY, LOAD_FAILED } from "@/lib/messages";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (nextFilter: Filter) => {
    const requestId = ++requestIdRef.current;
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
      if (requestId !== requestIdRef.current) {
        return;
      }
      setFoods(parseFoodList(data));
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

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

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
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="text-xl font-semibold tracking-tight">{title}</p>
        <FoodSearch value={query} onChange={setQuery} />
        <Segmented value={filter} options={FILTERS} onChange={setFilter} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-28">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load(filter)} />
        ) : null}

        {!loading && !error && visibleFoods.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {emptyMessage(filter, query)}
          </p>
        ) : null}

        {!loading && !error && visibleFoods.length > 0 ? (
          <FoodList
            foods={visibleFoods}
            showFavorite={false}
            onSelectFood={onPick}
          />
        ) : null}
      </div>

      <div className="app-fixed-bottom app-sticky-actions pointer-events-none mx-auto w-full max-w-lg bg-gradient-to-t from-background from-40% to-transparent px-4 pt-8 pb-[max(1.25rem,var(--app-safe-bottom))]">
        <div className="pointer-events-auto" data-keyboard-secondary>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            onClick={onClose}
          >
            Отмена
          </Button>
        </div>
      </div>
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
