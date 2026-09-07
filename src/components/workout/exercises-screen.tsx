"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { EXERCISES_EMPTY, LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/numbers";

export function ExercisesScreen() {
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises?filter=active");
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

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Упражнения" backHref="/workouts" />

      <div className="px-4 pb-24">
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
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            {EXERCISES_EMPTY}
          </p>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <ul className="animate-rise flex flex-col">
            {exercises.map((exercise) => (
              <li
                key={exercise.id}
                className="border-b border-border/70 last:border-b-0"
              >
                <Link
                  href={`/workouts/exercises/${exercise.id}`}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium">
                      {exercise.short_name || exercise.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-lg tabular-nums font-semibold tracking-tight">
                      {exercise.current_max
                        ? formatWeight(exercise.current_max.max_weight)
                        : "—"}
                    </span>
                    <ChevronRight
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <StickyActions>
        <Link
          href="/workouts/exercises/new"
          className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
        >
          <Plus className="size-5" aria-hidden />
          Новое упражнение
        </Link>
      </StickyActions>
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
