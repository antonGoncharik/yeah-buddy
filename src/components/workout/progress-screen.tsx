"use client";

import Link from "next/link";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { BarbellDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import {
  type ProgressFilter,
  useProgressScreen,
} from "@/components/workout/use-progress-screen";
import { WeekTonnageChart } from "@/components/workout/week-tonnage-chart";
import { WEIGHT_DELTA_KG } from "@/lib/ai/signal-nutrition";
import {
  formatBodyWeight,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import type { ExerciseProgress, StrengthProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  countSessionFeels,
  formatFrequencyVsProgram,
  formatGymGap,
  formatSessionFeels,
  formatSessionRateHalves,
  sessionRateHalves,
} from "@/lib/workout/history-stats";
import { EXERCISE_CATEGORY_LABELS } from "@/lib/workout/labels";
import {
  formatSignedPercent,
  formatSignedWeight,
  formatTonnage,
  formatWeight,
} from "@/lib/workout/numbers";
import {
  bodyWeightSpan,
  controlLifts,
  formatPeakRecord,
  formatWeeklyTonnageLine,
  horizonDayCount,
  isNewPeak,
  PROGRESS_HORIZON_OPTIONS,
  type ProgressHorizon,
  peakRecords,
  totalTonnage,
  uniqueWorkDates,
  weeklyTonnage,
} from "@/lib/workout/progress-control";
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
    viewed,
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

        {!loading && progress && viewed && progress.exercises.length > 0 ? (
          <>
            <div className="animate-rise">
              <Segmented
                value={horizon}
                options={PROGRESS_HORIZON_OPTIONS}
                onChange={setHorizon}
              />
            </div>

            {tracked.length === 0 ? (
              <EmptyNote
                icon={<DumbbellDoodle className="h-5 w-10" />}
                title="За эти дни зала не было"
                hint="Поставь «Всё» — там кривые с первой записи."
              />
            ) : (
              <SummaryCard
                viewed={viewed}
                lifetime={progress}
                tracked={tracked}
                horizon={horizon}
                from={horizonStart}
                to={today}
              />
            )}

            {mixedCategories ? (
              <div className="animate-rise">
                <Segmented
                  value={filter}
                  options={FILTERS}
                  onChange={setFilter}
                />
              </div>
            ) : null}

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
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  viewed,
  lifetime,
  tracked,
  horizon,
  from,
  to,
}: {
  viewed: StrengthProgress;
  lifetime: StrengthProgress;
  tracked: ExerciseProgress[];
  horizon: ProgressHorizon;
  from: string | null;
  to: string;
}) {
  const fromWork = tracked.some((item) => item.from_work);
  const moved = viewed.avg_percent != null && viewed.avg_percent !== 0;
  const weight = bodyWeightSpan(lifetime.weights, from, to);
  const showWeight =
    weight.start != null &&
    weight.end != null &&
    weight.delta != null &&
    Math.abs(weight.delta) >= WEIGHT_DELTA_KG;
  const lifts = controlLifts(tracked);
  const records = peakRecords(lifetime.exercises, from, to).slice(0, 8);
  const weeks = weeklyTonnage(lifetime.exercises, from, to);
  const tonnage = totalTonnage(weeks);
  const tonnageLine = formatWeeklyTonnageLine(weeks);
  const workDates = uniqueWorkDates(tracked);
  const sessionDates =
    viewed.sessions.length > 0
      ? viewed.sessions.map((session) => session.date)
      : workDates;
  const spanDays = horizonDayCount(from, to, sessionDates[0] ?? workDates[0]);
  const frequency = formatFrequencyVsProgram(
    new Set(sessionDates).size,
    spanDays,
    lifetime.circle_size,
  );
  const spanFrom = from ?? sessionDates[0] ?? workDates[0];
  const halves = spanFrom
    ? sessionRateHalves(sessionDates, spanFrom, to)
    : null;
  const gap = spanFrom ? formatGymGap(spanFrom, to, sessionDates) : null;
  const feelLine = formatSessionFeels(countSessionFeels(viewed.sessions));

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {horizon === "all" ? "С первой записи" : `За ${horizon} дней`}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {moved && viewed.avg_percent != null ? (
            <>
              {formatSignedPercent(viewed.avg_percent)}
              <span className="ml-2 text-lg font-medium text-muted-foreground">
                в среднем
              </span>
            </>
          ) : (
            "Пока без изменений"
          )}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {viewed.grown_count > 0
            ? `Выросли ${viewed.grown_count} из ${tracked.length}`
            : fromWork
              ? `${trackedCountLabel(tracked.length)} из зала. Рост покажется после следующей записи.`
              : `${trackedCountLabel(tracked.length)}. Рост покажется после зала.`}
          {viewed.avg_relative_percent == null || !moved
            ? null
            : ` · к весу тела ${formatSignedPercent(viewed.avg_relative_percent)}`}
        </p>
        {moved ? <CategoryLine exercises={tracked} /> : null}
        {frequency || gap ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {[frequency, halves ? formatSessionRateHalves(halves) : null, gap]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {feelLine ? (
          <p className="mt-2 text-sm text-muted-foreground">{feelLine}</p>
        ) : null}
      </div>

      {showWeight ? (
        <p className="text-base tabular-nums">
          Вес {formatBodyWeight(weight.start ?? 0)} →{" "}
          {formatBodyWeight(weight.end ?? 0)}{" "}
          <span className="text-muted-foreground">
            ({formatSignedBodyWeight(weight.delta ?? 0)} кг)
          </span>
        </p>
      ) : null}

      {tonnage > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Тоннаж {formatTonnage(tonnage)}
            {weeks.length < 2 && tonnageLine ? ` · ${tonnageLine}` : ""}
          </p>
          <WeekTonnageChart weeks={weeks} />
        </div>
      ) : null}

      {lifts.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-t border-border/70 pt-4">
          {lifts.map((item) => (
            <li
              key={item.exercise_id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{item.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {liftLine(item)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {records.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t border-border/70 pt-4">
          {records.map((row) => (
            <li
              key={`${row.exercise_id}:${row.date}:${row.weight}`}
              className="text-sm text-muted-foreground"
            >
              {formatPeakRecord(row)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function liftLine(item: ExerciseProgress): string {
  if (item.start_weight == null || item.current_weight == null) {
    return item.current_weight == null
      ? "—"
      : `${formatWeight(item.current_weight)} кг`;
  }
  if (item.delta == null || item.delta === 0) {
    return `${formatWeight(item.current_weight)} кг`;
  }
  return `${formatWeight(item.start_weight)} → ${formatWeight(item.current_weight)} · ${formatSignedWeight(item.delta)} кг`;
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
