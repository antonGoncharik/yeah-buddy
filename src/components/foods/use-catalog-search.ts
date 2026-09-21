"use client";

import { useEffect, useRef, useState } from "react";

import { foodSearchEasterEgg } from "@/lib/flavor";
import {
  type CatalogFood,
  catalogSearchTokens,
  parseBarcodeEan,
  parseCatalogFoodList,
  parseCatalogFoodPayload,
} from "@/lib/food/catalog-map";

export function useCatalogSearch(query: string): {
  foods: CatalogFood[];
  loading: boolean;
  dismiss: (id: string) => void;
} {
  const [foods, setFoods] = useState<CatalogFood[]>([]);
  const [loadedNeedle, setLoadedNeedle] = useState("");
  const requestIdRef = useRef(0);
  const needle = query.trim();
  const ean = parseBarcodeEan(needle);
  const searching =
    (ean != null || catalogSearchTokens(query) != null) &&
    foodSearchEasterEgg(query) == null;

  useEffect(() => {
    if (!searching) {
      requestIdRef.current += 1;
      setFoods([]);
      setLoadedNeedle("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const delay = ean ? 400 : 200;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const foods = ean
            ? await loadBarcode(ean)
            : await loadNameSearch(needle);
          if (requestId !== requestIdRef.current) {
            return;
          }
          setFoods(foods);
        } catch {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setFoods([]);
        } finally {
          if (requestId === requestIdRef.current) {
            setLoadedNeedle(needle);
          }
        }
      })();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [ean, needle, searching]);

  function dismiss(id: string) {
    setFoods((current) => current.filter((food) => food.id !== id));
  }

  return {
    foods: searching && loadedNeedle === needle ? foods : [],
    loading: searching && loadedNeedle !== needle,
    dismiss,
  };
}

async function loadNameSearch(needle: string): Promise<CatalogFood[]> {
  const response = await fetch(
    `/api/catalog-foods?q=${encodeURIComponent(needle)}`,
  );
  if (!response.ok) {
    throw new Error("load failed");
  }
  return parseCatalogFoodList(await response.json());
}

async function loadBarcode(ean: string): Promise<CatalogFood[]> {
  const response = await fetch(`/api/catalog-foods/barcode/${ean}`);
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error("load failed");
  }
  const food = parseCatalogFoodPayload(await response.json());
  return food ? [food] : [];
}
