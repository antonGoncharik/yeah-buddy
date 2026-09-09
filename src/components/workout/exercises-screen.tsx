"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXERCISES_EMPTY, LOAD_FAILED, readApiError } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type { ExerciseWithMax } from "@/lib/types";
import { cn } from "@/lib/utils";
import { readExercises } from "@/lib/workout/hub-payload";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";
import { formatWeight } from "@/lib/workout/numbers";

export function ExercisesScreen() {
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
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: exercise.is_active }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

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
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Упражнения" backHref="/workouts" />

      <div className="px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && exercises.length === 0 ? (
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

        {!loading && exercises.length > 0 ? (
          <div className="animate-rise flex flex-col gap-8">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск упражнения"
              className="h-14 rounded-2xl text-base"
              inputMode="search"
              enterKeyHint="search"
            />
            {error ? (
              <p className="text-center text-base text-destructive">{error}</p>
            ) : null}
            {filtered.length === 0 ? (
              <p className="px-1 text-base text-muted-foreground">
                Ничего не нашлось.
              </p>
            ) : (
              <>
                <ExerciseGroup
                  title="Делаю"
                  hint="Только эти попадают в макроцикл и очередь."
                  empty="Пока ничего не выбрано — включи из списка ниже."
                  exercises={active}
                  busyId={busyId}
                  actionLabel="Не делаю"
                  onToggle={(exercise) => void toggleActive(exercise)}
                />
                <ExerciseGroup
                  title="Не делаю"
                  hint="Справочник остаётся, в план сами не попадают."
                  empty="Все упражнения в работе."
                  exercises={idle}
                  busyId={busyId}
                  actionLabel="Делаю"
                  onToggle={(exercise) => void toggleActive(exercise)}
                />
              </>
            )}
          </div>
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

function ExerciseGroup({
  title,
  hint,
  empty,
  exercises,
  busyId,
  actionLabel,
  onToggle,
}: {
  title: string;
  hint: string;
  empty: string;
  exercises: ExerciseWithMax[];
  busyId: string | null;
  actionLabel: string;
  onToggle: (exercise: ExerciseWithMax) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="px-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {exercises.length === 0 ? (
        <p className="px-1 py-2 text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="border-b border-border/70 last:border-b-0"
            >
              <div className="flex items-center gap-2 py-2.5">
                <Link
                  href={`/workouts/exercises/${exercise.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1"
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
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 shrink-0 px-2.5 text-sm"
                  disabled={busyId === exercise.id}
                  onClick={() => onToggle(exercise)}
                >
                  {actionLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
