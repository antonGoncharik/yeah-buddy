"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { patchJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type { ExerciseWithMax } from "@/lib/types";
import { readExercises } from "@/lib/workout/hub-payload";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";

export function useExercisesScreen() {
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises?filter=all");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setExercises(readExercises(data));
    } catch {
      setError(LOAD_FAILED);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return exercises;
    }
    return exercises.filter((exercise) => {
      const name = exercise.name.toLowerCase();
      const short = (exercise.short_name ?? "").toLowerCase();
      return name.includes(needle) || short.includes(needle);
    });
  }, [exercises, query]);

  const active = useMemo(
    () => filtered.filter((exercise) => exercise.is_active),
    [filtered],
  );
  const idle = useMemo(
    () => filtered.filter((exercise) => !exercise.is_active),
    [filtered],
  );

  async function toggleActive(exercise: ExerciseWithMax) {
    setBusyId(exercise.id);
    setError(null);

    try {
      const data = await patchJson(`/api/exercises/${exercise.id}`, {
        archived: exercise.is_active,
      });
      const updated = parseExerciseWithMax(
        isRecord(data) ? data.exercise : null,
      );
      if (!updated) {
        await load();
        return;
      }

      setExercises((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusyId(null);
    }
  }

  return {
    exercises,
    loading,
    error,
    load,
    busyId,
    query,
    setQuery,
    filtered,
    active,
    idle,
    toggleActive,
  };
}
