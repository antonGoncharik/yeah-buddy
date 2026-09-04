"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
  EXERCISES_ARCHIVED_EMPTY,
  EXERCISES_EMPTY,
  LOAD_FAILED,
} from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EXERCISE_SLOT_LABELS } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

type Filter = "active" | "archived";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "active", label: "Активные" },
  { id: "archived", label: "Архив" },
];

export function ExercisesScreen() {
  const [filter, setFilter] = useState<Filter>("active");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilter: Filter) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/exercises?filter=${encodeURIComponent(nextFilter)}`,
      );
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
    void load(filter);
  }, [filter, load]);

  const emptyMessage = useMemo(
    () => (filter === "archived" ? EXERCISES_ARCHIVED_EMPTY : EXERCISES_EMPTY),
    [filter],
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Упражнения" backHref="/workouts" />

      <div className="animate-rise px-4">
        <Segmented value={filter} options={FILTERS} onChange={setFilter} />
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load(filter)}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            {emptyMessage}
          </p>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {exercises.map((exercise, index) => (
              <li
                key={exercise.id}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
              >
                <Link
                  href={`/workouts/exercises/${exercise.id}`}
                  className="card-surface block px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <p className="truncate text-lg font-medium">
                    {exercise.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[
                      exercise.slot
                        ? EXERCISE_SLOT_LABELS[exercise.slot]
                        : null,
                      `шаг ${exercise.weight_step} кг`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {exercise.current_max
                      ? `${formatWeight(exercise.current_max.max_weight)} кг`
                      : "максимум не задан"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="animate-rise px-4" style={{ animationDelay: "80ms" }}>
        <Link
          href="/workouts/exercises/new"
          className={cn(buttonVariants(), "h-14 w-full text-lg")}
        >
          Добавить упражнение
        </Link>
      </div>
    </div>
  );
}

function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
}
