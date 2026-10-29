"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { BarbellDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import { ProgressScreenLinks } from "@/components/workout/progress-screen-links";
import { ProgressSummaryCard } from "@/components/workout/progress-summary-card";
import {
  type ProgressFilter,
  useProgressScreen,
} from "@/components/workout/use-progress-screen";
import { cn } from "@/lib/utils";
import { EXERCISE_CATEGORY_LABELS, STRENGTH_LABEL } from "@/lib/workout/labels";
import {
  isNewPeak,
  PROGRESS_HORIZON_OPTIONS,
} from "@/lib/workout/progress-control";
import { rankExerciseProgress } from "@/lib/workout/progress-rank";

const FILTERS: Array<{ id: ProgressFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "base", label: EXERCISE_CATEGORY_LABELS.base },
  { id: "isolation", label: EXERCISE_CATEGORY_LABELS.isolation },
];

export function ProgressScreen() {
  const {
    progress,
    loading,
    error,
    load,
    filter,
    setFilter,
    horizon,
    setHorizon,
    horizonStart,
    today,
    openId,
    setOpenId,
    tracked,
    mixedCategories,
    visible,
    programIds,
  } = useProgressScreen();
  const ranked = useMemo(
    () => rankExerciseProgress(visible, programIds),
    [programIds, visible],
  );
  const listKey = `${filter}:${horizon}`;
  const [restKey, setRestKey] = useState<string | null>(null);
  const showRest = restKey === listKey;
  const shown = showRest ? ranked : ranked.slice(0, 8);
  const hiddenCount = ranked.length - shown.length;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={STRENGTH_LABEL}
        subtitle="Сильнее ли стал"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && progress && progress.exercises.length === 0 ? (
          <EmptyNote
            icon={<BarbellDoodle className="h-5 w-10" />}
            title="Пока нечего сравнивать"
            hint="Здесь появятся упражнения с записью из зала: сначала одна точка, потом линия. Максимум на раз задаётся в упражнениях или в первой тренировке."
            action={
              <Link
                href="/workouts/exercises"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 text-base",
                )}
              >
                Открыть упражнения
              </Link>
            }
          />
        ) : null}

        {!loading && progress && progress.exercises.length > 0 ? (
          <>
            <div className="animate-rise">
              <Segmented
                value={horizon}
                options={PROGRESS_HORIZON_OPTIONS}
                onChange={setHorizon}
              />
            </div>

            {mixedCategories ? (
              <div className="animate-rise">
                <Segmented
                  value={filter}
                  options={FILTERS}
                  onChange={setFilter}
                />
              </div>
            ) : null}

            {tracked.length === 0 ? (
              <EmptyNote
                icon={<DumbbellDoodle className="h-5 w-10" />}
                title="За эти дни зала не было"
                hint="Поставь «Всё» — там кривые с первой записи."
              />
            ) : (
              <ProgressSummaryCard
                lifetime={progress}
                tracked={tracked}
                filter={filter}
                mixedCategories={mixedCategories}
                horizon={horizon}
                from={horizonStart}
                to={today}
              />
            )}

            {visible.length === 0 && tracked.length > 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Нет упражнений в этой категории.
              </p>
            ) : (
              <ul className="animate-rise flex flex-col gap-2">
                {shown.map((item) => {
                  const lifetime = progress.exercises.find(
                    (row) => row.exercise_id === item.exercise_id,
                  );
                  return (
                    <li key={item.exercise_id}>
                      <ProgressExerciseCard
                        item={item}
                        record={lifetime ? isNewPeak(lifetime, item) : false}
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
                  );
                })}
              </ul>
            )}
            {hiddenCount > 0 ? (
              <button
                type="button"
                className="h-12 text-base font-medium text-muted-foreground"
                onClick={() => setRestKey(listKey)}
              >
                Ещё {hiddenCount}
              </button>
            ) : null}

            <ReviewCta from="workouts" />
            <ProgressScreenLinks />
          </>
        ) : null}
      </div>
    </div>
  );
}
