"use client";

import { useState } from "react";

import { CatalogFoodList } from "@/components/foods/food-list";
import { useCatalogSearch } from "@/components/foods/use-catalog-search";
import { postJson } from "@/lib/api-cache";
import { foodSearchEasterEgg } from "@/lib/flavor";
import { CATALOG_SEARCH_MIN, type CatalogFood } from "@/lib/food/catalog-map";
import { readFoodPayload } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

export function CatalogFoodSection({
  query,
  onAdded,
  emptyLabel,
}: {
  query: string;
  onAdded: (food: Food) => void | Promise<void>;
  emptyLabel?: string;
}) {
  const catalog = useCatalogSearch(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addFromCatalog(item: CatalogFood) {
    setPendingId(item.id);
    setError(null);
    try {
      const data = await postJson(`/api/catalog-foods/${item.id}/add`, {});
      const food = readFoodPayload(data);
      if (!food) {
        throw new Error(LOAD_FAILED);
      }
      catalog.dismiss(item.id);
      await onAdded(food);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setPendingId(null);
    }
  }

  if (!catalogSearchActive(query)) {
    return null;
  }

  if (!catalog.loading && catalog.foods.length === 0 && !error) {
    return emptyLabel ? (
      <p className="py-10 text-center text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-1 pt-1 text-sm font-medium text-muted-foreground">
        Магазин
      </h3>
      {error ? <p className="px-1 text-sm text-destructive">{error}</p> : null}
      {catalog.loading && catalog.foods.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">Ищу в магазине…</p>
      ) : (
        <CatalogFoodList
          foods={catalog.foods}
          pendingId={pendingId}
          onSelectFood={(item) => void addFromCatalog(item)}
        />
      )}
    </div>
  );
}

export function catalogSearchActive(query: string): boolean {
  return (
    query.trim().length >= CATALOG_SEARCH_MIN &&
    foodSearchEasterEgg(query) == null
  );
}
