"use client";

import Link from "next/link";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import {
  type ProgressFilter,
  useProgressScreen,
} from "@/components/workout/use-progress-screen";
import type { ExerciseProgress, StrengthProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
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
    tracked,
    mixedCategories,
    visible,
  } = useProgressScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Рабочие веса"
        subtitle="Как менялись от записи к записи"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && progress && tracked.length === 0 ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">Пока нечего сравнивать</p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Здесь появятся упражнения с рабочим весом: сначала одна точка,
              потом линия. Веса задаются в упражнениях или в первой тренировке.
            </p>
            <Link
              href="/workouts/exercises"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 text-base",
              )}
            >
              Открыть упражнения
            </Link>
          </section>
        ) : null}

        {!loading && progress && tracked.length > 0 ? (
          <>
            <SummaryCard progress={progress} tracked={tracked} />

            {mixedCategories ? (
              <div className="animate-rise">
                <Segmented
                  value={filter}
                  options={FILTERS}
                  onChange={setFilter}
                />
              </div>
            ) : null}

            {visible.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Нет упражнений в этой категории.
              </p>
            ) : (
              <ul className="animate-rise flex flex-col gap-2">
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

            <ReviewCta from="workouts" />
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  progress,
  tracked,
}: {
  progress: StrengthProgress;
  tracked: ExerciseProgress[];
}) {
  const fromWork = tracked.some((item) => item.from_work);
  const moved = progress.avg_percent != null && progress.avg_percent !== 0;

  return (
    <section className="card-surface animate-rise px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        С первой записи
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {moved && progress.avg_percent != null ? (
          <>
            {formatSignedPercent(progress.avg_percent)}
            <span className="ml-2 text-lg font-medium text-muted-foreground">
              в среднем
            </span>
          </>
        ) : (
          "Пока без изменений"
        )}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {progress.grown_count > 0
          ? `Выросли ${progress.grown_count} из ${tracked.length}`
          : fromWork
            ? `${trackedCountLabel(tracked.length)} из зала. Рост покажется после следующей записи.`
            : `${trackedCountLabel(tracked.length)}. Рост покажется после зала.`}
        {progress.avg_relative_percent == null || !moved
          ? null
          : ` · к весу тела ${formatSignedPercent(progress.avg_relative_percent)}`}
      </p>
      {moved ? <CategoryLine exercises={tracked} /> : null}
    </section>
  );
}

function trackedCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} упражнение с весом`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} упражнения с весом`;
  }
  return `${count} упражнений с весом`;
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
