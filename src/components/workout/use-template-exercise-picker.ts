"use client";

import { useMemo, useState } from "react";

import type { ExerciseWithMax } from "@/lib/types";
import {
  exerciseCatalogSearchNeedle,
  filterExercisesForCatalogBrowse,
} from "@/lib/workout/exercise-catalog-browse";

export function useTemplateExercisePicker(available: ExerciseWithMax[]) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const needle = exerciseCatalogSearchNeedle(query);
  const ordered = useMemo(
    () => filterExercisesForCatalogBrowse(available, query),
    [available, query],
  );
  const showSearch = available.length > 8;

  return {
    query,
    setQuery,
    openId,
    setOpenId,
    needle,
    ordered,
    showSearch,
  };
}
