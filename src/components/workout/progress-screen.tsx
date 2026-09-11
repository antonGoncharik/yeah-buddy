"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import {
  type ProgressFilter,
  useProgressScreen,
} from "@/components/workout/use-progress-screen";
import type { ExerciseProgress } from "@/lib/types";
import { EXERCISE_CATEGORY_LABELS } from "@/lib/workout/labels";
import { formatSignedPercent } from "@/lib/workout/numbers";
import {
  CATEGORY_SHORT_LABELS,
  categoryAverages,
} from "@/lib/workout/progress-stats";

const FILTERS: Array<{ id: ProgressFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "base", label: EXERCISE_CATEGORY_LABELS.base },
  { id: "isolation", label: "Изол." },
];

export function ProgressScreen() {
  const {
    progress,
    loading,
    error,
    load,
    filter,
    setFilter,
    openId,
    setOpenId,
    visible,
  } = useProgressScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Прогресс" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

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
                {progress.exercises.some((item) => item.from_work)
                  ? "С первых рабочих"
                  : "С первых рабочих весов"}
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
                  : progress.exercises.some((item) => item.from_work)
                    ? "Рабочие веса из зала."
                    : "Появятся после зала."}
                {progress.avg_relative_percent == null
                  ? null
                  : ` · к весу тела ${formatSignedPercent(progress.avg_relative_percent)}`}
              </p>
              <CategoryLine exercises={progress.exercises} />
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
                    <ProgressExerciseCard
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

function CategoryLine({ exercises }: { exercises: ExerciseProgress[] }) {
  const rows = categoryAverages(exercises);
  if (rows.length === 0) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-muted-foreground">
      {rows
        .map(
          (row) =>
            `${CATEGORY_SHORT_LABELS[row.id]} ${formatSignedPercent(row.avg_percent)}`,
        )
        .join(" · ")}
    </p>
  );
}
