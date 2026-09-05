"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
  ProgressChart,
  ProgressSparkline,
} from "@/components/workout/progress-chart";
import { LOAD_FAILED } from "@/lib/messages";
import type {
  ExerciseCategory,
  ExerciseProgress,
  StrengthProgress,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import {
  formatSignedPercent,
  formatSignedWeight,
  formatWeight,
} from "@/lib/workout/numbers";

type Filter = "all" | ExerciseCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "base", label: "База" },
  { id: "armwrestling", label: "Арм" },
  { id: "isolation", label: "Изол." },
];

export function ProgressScreen() {
  const [progress, setProgress] = useState<StrengthProgress | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      const response = await fetch("/api/progress");
      if (!response.ok) {
        throw new Error("load failed");
      }
      const data: unknown = await response.json();
      const next = readProgress(data);
      if (!next) {
        throw new Error("load failed");
      }
      setProgress(next);
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setProgress(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const list = progress?.exercises ?? [];
    if (filter === "all") {
      return list;
    }
    return list.filter((item) => item.category === filter);
  }, [filter, progress]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Прогресс" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
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

        {!loading && progress ? (
          <>
            <section className="card-surface animate-rise px-5 py-5">
              <p className="text-sm font-medium text-muted-foreground">
                С первых максимумов
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {progress.avg_percent == null ? (
                  "Пока рано"
                ) : (
                  <>
                    {formatSignedPercent(progress.avg_percent)}
                    <span className="ml-2 text-lg font-medium text-muted-foreground">
                      в среднем
                    </span>
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {progress.grown_count > 0
                  ? `Выросли ${progress.grown_count} из ${progress.exercises.length}`
                  : "Кривая строится по максимумам фаз: разгон → рывок."}
              </p>
            </section>

            <div className="animate-rise">
              <Segmented
                value={filter}
                options={FILTERS}
                onChange={setFilter}
              />
            </div>

            {visible.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Нет упражнений в этой категории.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((item) => (
                  <li key={item.exercise_id}>
                    <ExerciseProgressCard
                      item={item}
                      open={openId === item.exercise_id}
                      onToggle={() =>
                        setOpenId((current) =>
                          current === item.exercise_id
                            ? null
                            : item.exercise_id,
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ExerciseProgressCard({
  item,
  open,
  onToggle,
}: {
  item: ExerciseProgress;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="card-surface px-5 py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {item.current_weight == null
              ? "Нет максимума"
              : `${formatWeight(item.current_weight)} кг`}
            {item.delta != null && item.percent != null ? (
              <span
                className={cn(
                  "ml-2 font-medium",
                  item.delta > 0 && "text-primary",
                  item.delta < 0 && "text-destructive",
                )}
              >
                {formatSignedWeight(item.delta)} кг ·{" "}
                {formatSignedPercent(item.percent)}
              </span>
            ) : null}
          </p>
        </div>
        <ProgressSparkline points={item.points} />
      </button>
      {open ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <ProgressChart points={item.points} />
        </div>
      ) : null}
    </article>
  );
}

function readProgress(data: unknown): StrengthProgress | null {
  if (!data || typeof data !== "object" || !("exercises" in data)) {
    return null;
  }

  return data as StrengthProgress;
}
