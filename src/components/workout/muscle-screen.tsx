"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { MuscleWeekProgressShare } from "@/components/share/muscle-week-progress-share";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MuscleBalanceBars } from "@/components/workout/muscle-balance-bars";
import { MuscleBodyFigure } from "@/components/workout/muscle-body-figure";
import { MuscleHeatGrid } from "@/components/workout/muscle-heat-grid";
import { MuscleWeeklySparkline } from "@/components/workout/muscle-weekly-sparkline";
import {
  type MuscleHorizon,
  useMuscleScreen,
} from "@/components/workout/use-muscle-screen";
import { formatIsoDate } from "@/lib/day/format";
import type { MuscleCell, MuscleId, VolumeBand } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleBandLabel,
  muscleCellHint,
  muscleVolumeLegendSuffix,
  muscleVolumeSwatchStyle,
} from "@/lib/workout/muscle-heat-style";
import { setsShortOfGrowthZone } from "@/lib/workout/muscle-insights";
import { VOLUME_BAND_LABELS } from "@/lib/workout/muscle-volume";
import { muscleVolumeLandmarkLine } from "@/lib/workout/muscle-volume-landmarks";
import { formatTonnage } from "@/lib/workout/numbers";

const HORIZONS: Array<{ id: MuscleHorizon; label: string }> = [
  { id: "7", label: "7 дн" },
  { id: "14", label: "14" },
  { id: "30", label: "30" },
  { id: "90", label: "90" },
];

const VOLUME_LEGEND: Array<{ band: VolumeBand; label: string }> = (
  [0, 1, 2, 3, 4] as const
).map((band) => ({ band, label: VOLUME_BAND_LABELS[band] }));

export function MuscleScreen() {
  const {
    snapshot,
    loading,
    error,
    load,
    horizon,
    setHorizon,
    view,
    setView,
    displayMode,
    setDisplayMode,
    selectedId,
    setSelectedId,
    selected,
    selectedHits,
  } = useMuscleScreen();

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (selected && selected.view !== view) {
      setSelectedId(null);
    }
  }, [selected, setSelectedId, view]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) {
        return;
      }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        return;
      }
      setView(dx > 0 ? "front" : "back");
    },
    [setView],
  );

  const onSelectMuscle = useCallback(
    (id: MuscleId) => {
      setSelectedId(id);
      const cell = snapshot?.muscles.find((item) => item.id === id);
      if (cell) {
        setView(cell.view);
      }
    },
    [setSelectedId, setView, snapshot],
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Мышцы"
        subtitle="Объём и восстановление по зонам"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <Segmented
          value={horizon}
          options={HORIZONS}
          onChange={setHorizon}
          disabled={loading}
        />

        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && snapshot && snapshot.completed_sessions === 0 ? (
          <EmptyNote
            icon={<DumbbellDoodle className="h-5 w-10" />}
            title="Пока пусто"
            hint="Закрой хотя бы одну тренировку за выбранный период — тело подсветится по упражнениям из зала. Связь с каталогом точнее, но и без неё сработает по названию."
            action={
              <Link href="/workouts" className={cn(buttonVariants(), "h-12")}>
                К залу
              </Link>
            }
          />
        ) : null}

        {!loading && snapshot && snapshot.completed_sessions > 0 ? (
          <>
            <Segmented
              value={displayMode}
              options={[
                { id: "volume", label: "Объём" },
                { id: "recovery", label: "Восст." },
              ]}
              onChange={setDisplayMode}
            />

            {snapshot.insights.length > 0 ? (
              <ul className="card-surface flex flex-col gap-2 px-4 py-3 text-sm leading-snug">
                {snapshot.insights.map((line) => (
                  <li key={line} className="text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="card-surface flex flex-col gap-3 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {formatIsoDate(snapshot.since, "d MMM")} —{" "}
                  {formatIsoDate(snapshot.until, "d MMM")}
                </p>
                <div className="sm:hidden">
                  <Segmented
                    value={view}
                    options={[
                      { id: "front", label: "Спереди" },
                      { id: "back", label: "Сзади" },
                    ]}
                    onChange={setView}
                  />
                </div>
              </div>

              <div className="hidden w-full items-start justify-center gap-3 sm:flex">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">Спереди</span>
                  <MuscleBodyFigure
                    view="front"
                    muscles={snapshot.muscles}
                    selectedId={selectedId}
                    displayMode={displayMode}
                    onSelect={onSelectMuscle}
                    figureSex={snapshot.figure_sex}
                    zoomable
                    className="max-w-full"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">Сзади</span>
                  <MuscleBodyFigure
                    view="back"
                    muscles={snapshot.muscles}
                    selectedId={selectedId}
                    displayMode={displayMode}
                    onSelect={onSelectMuscle}
                    figureSex={snapshot.figure_sex}
                    zoomable
                    className="max-w-full"
                  />
                </div>
              </div>

              <div
                className="sm:hidden"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <MuscleBodyFigure
                  view={view}
                  muscles={snapshot.muscles}
                  selectedId={selectedId}
                  displayMode={displayMode}
                  onSelect={onSelectMuscle}
                  figureSex={snapshot.figure_sex}
                  zoomable
                />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Нажми на зону. Кнопки или щипок двумя пальцами — крупнее, потом
                можно двигать.
              </p>
              {snapshot.unmapped_exercise_count > 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  {unmappedExerciseLine(snapshot.unmapped_exercise_count)}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(["front", "back"] as const).map((side) => (
                <section
                  key={side}
                  className={cn(
                    "flex flex-col gap-2",
                    side !== view && "hidden sm:flex",
                  )}
                >
                  <h2 className="px-1 text-sm font-medium text-muted-foreground">
                    Зоны · {side === "front" ? "спереди" : "сзади"}
                  </h2>
                  <MuscleHeatGrid
                    muscles={snapshot.muscles.filter(
                      (item) => item.view === side,
                    )}
                    selectedId={selectedId}
                    displayMode={displayMode}
                    onSelect={onSelectMuscle}
                  />
                </section>
              ))}
            </div>

            {displayMode === "volume" ? (
              <ul className="flex flex-wrap gap-2 px-1">
                {VOLUME_LEGEND.map((item) => (
                  <li
                    key={item.band}
                    className="flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-xs text-muted-foreground"
                  >
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={muscleVolumeSwatchStyle(item.band, "volume")}
                      aria-hidden
                    />
                    {item.label}
                    {muscleVolumeLegendSuffix(item.band)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-xs text-muted-foreground">
                Восстановление: выше % — зона готова к тяжёлой работе. Крупные
                мышцы отходят дольше мелких.
              </p>
            )}

            <MuscleBalanceBars pairs={snapshot.balance} />

            {selected ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">{selected.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {muscleCellHint(selected)}
                  </p>
                </div>
                <MuscleWeeklySparkline cell={selected} />
                <p className="text-sm text-muted-foreground">
                  {muscleVolumeLandmarkLine(selected.id)}
                </p>
                {setsShortOfGrowthZone(selected) != null ? (
                  <p className="text-sm text-muted-foreground">
                    До зоны роста ещё ~{setsShortOfGrowthZone(selected)} прямых
                    подх./нед.
                  </p>
                ) : null}
                <MuscleSelectedActions cell={selected} />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {selected.direct_sets > 0 || selected.assist_sets > 0 ? (
                    <>
                      <div>
                        <dt className="text-muted-foreground">Прямые</dt>
                        <dd className="font-medium tabular-nums">
                          {formatSets(selected.direct_sets)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Помощь</dt>
                        <dd className="font-medium tabular-nums">
                          {formatSets(selected.assist_sets)}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div>
                      <dt className="text-muted-foreground">
                        Взвешенные подходы
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {formatSets(selected.sets)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">В неделю</dt>
                    <dd className="font-medium tabular-nums">
                      ~{selected.sets_per_week} ·{" "}
                      {muscleBandLabel(selected.volume_band)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Последний раз</dt>
                    <dd className="font-medium">
                      {selected.last_trained
                        ? formatIsoDate(selected.last_trained, "d MMM")
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Восстановление</dt>
                    <dd className="font-medium">
                      {selected.recovery_percent != null
                        ? `~${selected.recovery_percent}%`
                        : selected.days_since != null
                          ? `${selected.days_since} дн назад`
                          : "—"}
                    </dd>
                  </div>
                  {selected.missed_sessions > 0 ? (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        Пропущенных дней с зоной
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {selected.missed_sessions}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {selectedHits.length > 0 ? (
                  <ol className="divide-y divide-border/70 text-sm">
                    {selectedHits.map((hit) => (
                      <li
                        key={hit.exercise_id}
                        className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between"
                      >
                        <Link
                          href={`/workouts/exercises/${hit.exercise_id}`}
                          className="min-w-0 truncate font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {hit.name}
                        </Link>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatSets(hit.sets)} подх. ·{" "}
                          {formatIsoDate(hit.last_date, "d MMM")}
                          {hit.tonnage > 0
                            ? ` · ${formatTonnage(hit.tonnage)}`
                            : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нет упражнений с взвешенными подходами за период.
                  </p>
                )}
              </section>
            ) : (
              <p className="px-1 text-sm text-muted-foreground">
                Выбери зону — покажем недельный график и упражнения.
              </p>
            )}
          </>
        ) : null}

        {snapshot && snapshot.completed_sessions > 0 ? (
          <MuscleWeekProgressShare />
        ) : null}
      </div>
    </div>
  );
}

function MuscleSelectedActions({ cell }: { cell: MuscleCell }) {
  const gap = setsShortOfGrowthZone(cell);
  return (
    <div className="flex flex-col gap-2">
      {cell.in_next_session ? (
        <Link href="/workouts" className={cn(buttonVariants(), "h-11 w-full")}>
          В следующей тренировке
        </Link>
      ) : null}
      {gap != null && gap > 0 ? (
        <p className="text-sm text-muted-foreground">
          Добавь 2–3 подхода на {cell.label.toLowerCase()}, если хочешь закрыть
          недобор.
        </p>
      ) : null}
      <Link
        href={`/workouts/exercises?muscle=${cell.id}`}
        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
      >
        Упражнения на эту зону
      </Link>
    </div>
  );
}

function formatSets(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function unmappedExerciseLine(count: number): string {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  const verb =
    mod10 === 1 && mod100 !== 11
      ? "упражнение не попало"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "упражнения не попали"
        : "упражнений не попали";
  return `${n} ${verb} на схему`;
}
