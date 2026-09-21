"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { CatalogFoodList } from "@/components/foods/food-list";
import { useCatalogSearch } from "@/components/foods/use-catalog-search";
import { postJson } from "@/lib/api-cache";
import { foodSearchEasterEgg } from "@/lib/flavor";
import {
  type CatalogFood,
  catalogSearchTokens,
  parseBarcodeEan,
} from "@/lib/food/catalog-map";
import { readFoodPayload } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import type { Food } from "@/lib/types";

export function CatalogFoodSection({
  query,
  onAdded,
  onHits,
}: {
  query: string;
  onAdded: (food: Food) => void | Promise<void>;
  onHits?: (hasHits: boolean) => void;
}) {
  const catalog = useCatalogSearch(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasHits = catalog.foods.length > 0;

  useLayoutEffect(() => {
    onHits?.(catalog.loading || hasHits);
  }, [catalog.loading, hasHits, onHits]);

  useEffect(() => {
    return () => onHits?.(false);
  }, [onHits]);

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

  if (!hasHits && !error && !catalog.loading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="px-1 pt-1 text-sm font-medium text-muted-foreground">
        Магазин
      </h3>
      {error ? <p className="px-1 text-sm text-destructive">{error}</p> : null}
      {catalog.loading && !hasHits ? (
        <p className="px-1 text-sm text-muted-foreground">Ищем…</p>
      ) : null}
      {hasHits ? (
        <CatalogFoodList
          foods={catalog.foods}
          pendingId={pendingId}
          onSelectFood={(item) => void addFromCatalog(item)}
        />
      ) : null}
    </div>
  );
}

export function catalogSearchActive(query: string): boolean {
  if (foodSearchEasterEgg(query) != null) {
    return false;
  }

  return parseBarcodeEan(query) != null || catalogSearchTokens(query) != null;
}
