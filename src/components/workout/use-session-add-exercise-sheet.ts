"use client";

import { useEffect, useMemo, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { readExercises } from "@/lib/workout/hub-payload";
import { foldExerciseName } from "@/lib/workout/muscle-catalog-map";

export function useSessionAddExerciseSheet(open: boolean) {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void cachedGet("/api/exercises?filter=all", (data) => {
      if (!cancelled) {
        setExercises(readExercises(data));
      }
      return true;
    })
      .catch(() => {
        if (!cancelled) {
          setError(LOAD_FAILED);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return {
    query,
    setQuery,
    exercises,
    loading,
    error,
    addingId,
    setAddingId,
  };
}

export function filterExercisesForSessionAdd(
  exercises: ExerciseWithMax[],
  takenIds: string[],
  query: string,
): ExerciseWithMax[] {
  const taken = new Set(takenIds);
  const needle = foldExerciseName(query);
  return exercises.filter((exercise) => {
    if (taken.has(exercise.id)) {
      return false;
    }
    if (needle === "") {
      return exercise.is_active;
    }
    return foldExerciseName(
      `${exercise.name} ${exercise.short_name ?? ""}`,
    ).includes(needle);
  });
}

export function useSessionAddExerciseRows(
  exercises: ExerciseWithMax[],
  takenIds: string[],
  query: string,
) {
  return useMemo(
    () => filterExercisesForSessionAdd(exercises, takenIds, query),
    [exercises, query, takenIds],
  );
}
