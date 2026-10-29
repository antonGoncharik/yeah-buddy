"use client";

import { useState } from "react";

import { patchJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { readExerciseWithMaxFromApi } from "@/lib/workout/exercise-catalog-link-payload";
import type { CatalogExerciseSummary } from "@/lib/workout/exercise-catalog-map";

export function useExerciseCatalogLink({
  exerciseId,
  onLinked,
}: {
  exerciseId: string;
  onLinked: (next: ExerciseWithMax) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function linkCatalog(item: CatalogExerciseSummary | null) {
    setPendingId(item?.id ?? "unlink");
    setLinkError(null);
    try {
      const data = await patchJson(
        `/api/exercises/${exerciseId}/catalog-link`,
        {
          catalog_exercise_id: item?.id ?? null,
        },
      );
      const next = readExerciseWithMaxFromApi(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      onLinked(next);
      return next;
    } catch {
      setLinkError(LOAD_FAILED);
      return null;
    } finally {
      setPendingId(null);
    }
  }

  return { pendingId, linkError, setLinkError, linkCatalog };
}
