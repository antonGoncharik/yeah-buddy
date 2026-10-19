"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type {
  ExerciseWithMax,
  MuscleId,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { readExercises, readTemplates } from "@/lib/workout/hub-payload";
import { foldExerciseName } from "@/lib/workout/muscle-catalog-map";
import { MUSCLE_IDS, MUSCLE_LABELS } from "@/lib/workout/muscle-taxonomy";

export interface ExerciseGroups {
  /** Active exercises that appear in a queued workout. */
  queued: ExerciseWithMax[];
  /** Active exercises not in any queued workout. */
  rest: ExerciseWithMax[];
  /** Archived exercises («не делаю»). */
  idle: ExerciseWithMax[];
}

function parseMuscleFilter(value: string | null): MuscleId | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const id = value.trim() as MuscleId;
  return MUSCLE_IDS.includes(id) ? id : null;
}

export function useExercisesScreen() {
  const searchParams = useSearchParams();
  const muscleFilter = parseMuscleFilter(searchParams.get("muscle"));
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    begin();
    setError(null);
    const showCached = () => done(true);

    const exercisesPath =
      muscleFilter != null
        ? `/api/exercises?filter=all&muscle=${encodeURIComponent(muscleFilter)}`
        : "/api/exercises?filter=all";

    const [exercisesOk] = await Promise.all([
      cachedGet(
        exercisesPath,
        (data) => {
          setExercises(readExercises(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        "/api/templates",
        (data) => {
          setTemplates(readTemplates(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
    ]);

    if (!exercisesOk) {
      setError(LOAD_FAILED);
      done(false);
      return;
    }

    done(true);
  }, [begin, done, muscleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const muscleFilterLabel =
    muscleFilter != null ? MUSCLE_LABELS[muscleFilter] : null;

  const filtered = useMemo(() => {
    const needle = foldExerciseName(query);
    if (needle === "") {
      return exercises;
    }
    return exercises.filter((exercise) =>
      foldExerciseName(
        `${exercise.name} ${exercise.short_name ?? ""}`,
      ).includes(needle),
    );
  }, [exercises, query]);

  const groups = useMemo<ExerciseGroups>(() => {
    // Queue order, not alphabet: the list should read like the workouts do.
    const queuedOrder = new Map<string, number>();
    for (const template of templates) {
      if (!template.is_active) {
        continue;
      }
      for (const exercise of template.exercises) {
        if (!queuedOrder.has(exercise.id)) {
          queuedOrder.set(exercise.id, queuedOrder.size);
        }
      }
    }
    return {
      queued: filtered
        .filter(
          (exercise) => exercise.is_active && queuedOrder.has(exercise.id),
        )
        .sort(
          (a, b) => (queuedOrder.get(a.id) ?? 0) - (queuedOrder.get(b.id) ?? 0),
        ),
      rest: filtered.filter(
        (exercise) => exercise.is_active && !queuedOrder.has(exercise.id),
      ),
      idle: filtered.filter((exercise) => !exercise.is_active),
    };
  }, [filtered, templates]);

  return {
    exercises,
    loading,
    error,
    load,
    query,
    setQuery,
    filtered,
    groups,
    muscleFilter,
    muscleFilterLabel,
  };
}
