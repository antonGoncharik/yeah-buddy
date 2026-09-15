"use client";

import { useEffect, useRef, useState } from "react";

import {
  CATALOG_SEARCH_MIN,
  type CatalogFood,
  parseCatalogFoodList,
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
  const searching = needle.length >= CATALOG_SEARCH_MIN;

  useEffect(() => {
    if (!searching) {
      requestIdRef.current += 1;
      setFoods([]);
      setLoadedNeedle("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/catalog-foods?q=${encodeURIComponent(needle)}`,
          );
          if (!response.ok) {
            throw new Error("load failed");
          }
          const data: unknown = await response.json();
          if (requestId !== requestIdRef.current) {
            return;
          }
          setFoods(parseCatalogFoodList(data));
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
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [needle, searching]);

  function dismiss(id: string) {
    setFoods((current) => current.filter((food) => food.id !== id));
  }

  return {
    foods: searching && loadedNeedle === needle ? foods : [],
    loading: searching && loadedNeedle !== needle,
    dismiss,
  };
}
