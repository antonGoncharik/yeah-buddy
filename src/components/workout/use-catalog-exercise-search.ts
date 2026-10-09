"use client";

import { useEffect, useRef, useState } from "react";

import {
  type CatalogExerciseSummary,
  catalogExerciseSearchTokens,
  parseCatalogExerciseList,
} from "@/lib/workout/exercise-catalog-map";

export function useCatalogExerciseSearch(query: string): {
  exercises: CatalogExerciseSummary[];
  loading: boolean;
} {
  const [exercises, setExercises] = useState<CatalogExerciseSummary[]>([]);
  const [loadedNeedle, setLoadedNeedle] = useState("");
  const requestIdRef = useRef(0);
  const needle = query.trim();
  const searching = catalogExerciseSearchTokens(query) != null;

  useEffect(() => {
    if (!searching) {
      requestIdRef.current += 1;
      setExercises([]);
      setLoadedNeedle("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/catalog-exercises?q=${encodeURIComponent(needle)}`,
          );
          if (!response.ok) {
            throw new Error("load failed");
          }
          const hits = parseCatalogExerciseList(await response.json());
          if (requestId !== requestIdRef.current) {
            return;
          }
          setExercises(hits);
        } catch {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setExercises([]);
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

  const settled = searching && loadedNeedle === needle;
  return {
    exercises: settled ? exercises : [],
    loading: searching && loadedNeedle !== needle,
  };
}

export function catalogExerciseSearchActive(query: string): boolean {
  return catalogExerciseSearchTokens(query) != null;
}
