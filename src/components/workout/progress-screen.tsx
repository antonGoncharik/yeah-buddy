"use client";

import Link from "next/link";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { BarbellDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { StatGrid } from "@/components/ui/stat-grid";
import { ProgressBodyWeightChart } from "@/components/workout/progress-body-weight-chart";
import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import {
  type ProgressFilter,
  useProgressScreen,
} from "@/components/workout/use-progress-screen";
import { WeekTonnageChart } from "@/components/workout/week-tonnage-chart";
import { formatIsoDate } from "@/lib/day/format";
import type { ExerciseProgress, StrengthProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EXERCISE_CATEGORY_LABELS } from "@/lib/workout/labels";
import {
  formatSignedPercent,
  formatTonnage,
  formatWeight,
} from "@/lib/workout/numbers";
import { summarizeProgress } from "@/lib/workout/progress-build";
import {
  isNewPeak,
  PROGRESS_HORIZON_OPTIONS,
  type ProgressHorizon,
  peakRecords,
  totalTonnage,
  weeklyTonnage,
} from "@/lib/workout/progress-control";
import { categoryAverages } from "@/lib/workout/progress-stats";

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
    horizon,
    setHorizon,
    horizonStart,
    today,
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
              <SummaryCard
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
                {visible.map((item) => {
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

            <ReviewCta from="workouts" />
            <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
              <NavRow
                href="/workouts/muscles"
                title="Мышцы"
                hint="Схема нагрузки и пропусков"
                icon={<DumbbellDoodle />}
              />
              <NavRow
                href="/workouts/history"
                title="История тренировок"
                hint="Какие были занятия"
                icon={<DumbbellDoodle />}
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  lifetime,
  tracked,
  filter,
  mixedCategories,
  horizon,
  from,
  to,
}: {
  lifetime: StrengthProgress;
  tracked: ExerciseProgress[];
  filter: ProgressFilter;
  mixedCategories: boolean;
  horizon: ProgressHorizon;
  from: string | null;
  to: string;
}) {
  const summaryTracked = exercisesForSummary(tracked, filter, mixedCategories);
  const summary = summarizeProgress(summaryTracked);
  const fromWork = tracked.some((item) => item.from_work);
  const summaryScope =
    mixedCategories && filter !== "all"
      ? filter === "base"
        ? EXERCISE_CATEGORY_LABELS.base
        : EXERCISE_CATEGORY_LABELS.isolation
      : null;
  const showRelative =
    summary.avg_relative_percent != null &&
    summary.avg_percent != null &&
    Math.abs(summary.avg_relative_percent - summary.avg_percent) >= 2;
  const records = peakRecords(lifetime.exercises, from, to).slice(0, 6);
  const weeks = weeklyTonnage(lifetime.exercises, from, to);
  const tonnage = totalTonnage(weeks);

  const rangeLabel =
    from != null
      ? `${formatIsoDate(from, "d MMM")} – ${formatIsoDate(to, "d MMM")}`
      : null;

  return (
    <section className="card-surface animate-rise flex flex-col gap-6 px-5 py-5">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          {horizon === "all" ? "С первой записи" : `За ${horizon} дней`}
          {rangeLabel ? (
            <span className="font-normal"> · {rangeLabel}</span>
          ) : null}
          {summaryScope ? ` · ${summaryScope}` : ""}
        </p>
        <StatGrid
          size="lg"
          items={[
            {
              label: "В среднем",
              value:
                summary.avg_percent == null
                  ? "—"
                  : formatSignedPercent(summary.avg_percent),
              quiet: summary.avg_percent == null,
            },
            {
              label: "Выросли",
              value: `${summary.grown_count} из ${summaryTracked.length}`,
            },
            showRelative && summary.avg_relative_percent != null
              ? {
                  label: "К весу тела",
                  value: formatSignedPercent(summary.avg_relative_percent),
                }
              : { label: "К весу тела", value: "" },
          ]}
        />
        {summary.avg_percent == null ? (
          <p className="text-sm text-muted-foreground">
            {fromWork
              ? "Рост появится после следующей записи."
              : "Рост появится после зала."}
          </p>
        ) : null}
      </div>

      {!summaryScope ? <CategoryBars exercises={summaryTracked} /> : null}

      {horizon === "all" ? (
        <ProgressBodyWeightChart
          weights={lifetime.weights}
          from={from}
          to={to}
        />
      ) : null}

      {tonnage > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-3.5 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Тоннаж
            </h3>
            <p className="text-base font-semibold tabular-nums">
              {formatTonnage(tonnage)} кг
            </p>
          </div>
          {weeks.length >= 2 ? (
            <WeekTonnageChart weeks={weeks} heading={false} />
          ) : null}
        </div>
      ) : null}

      {records.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-muted-foreground">Рекорды</h3>
          <ul className="flex flex-col">
            {records.map((row) => (
              <li
                key={`${row.exercise_id}:${row.date}:${row.weight}`}
                className="flex items-baseline justify-between gap-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{row.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatIsoDate(row.date, "d MMM")}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatWeight(row.previous)} → {formatWeight(row.weight)} кг
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function exercisesForSummary(
  tracked: ExerciseProgress[],
  filter: ProgressFilter,
  mixedCategories: boolean,
): ExerciseProgress[] {
  if (!mixedCategories || filter === "all") {
    return tracked;
  }
  if (filter === "isolation") {
    return tracked.filter((item) => item.category === "isolation");
  }
  return tracked.filter((item) => item.category !== "isolation");
}

function CategoryBars({ exercises }: { exercises: ExerciseProgress[] }) {
  const rows = categoryAverages(exercises);
  if (rows.length < 2) {
    return null;
  }

  const peak = rows.reduce(
    (max, row) => Math.max(max, Math.abs(row.avg_percent)),
    1,
  );

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{EXERCISE_CATEGORY_LABELS[row.id]}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-medium tabular-nums",
                row.avg_percent > 0
                  ? "bg-primary/15"
                  : row.avg_percent < 0
                    ? "bg-destructive/12 text-destructive"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {formatSignedPercent(row.avg_percent)}
            </span>
          </div>
          {row.avg_percent !== 0 ? (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={
                  row.avg_percent >= 0
                    ? "h-full rounded-full bg-primary"
                    : "h-full rounded-full bg-destructive/70"
                }
                style={{
                  width: `${Math.max(6, Math.round((Math.abs(row.avg_percent) / peak) * 100))}%`,
                }}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
