"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { MuscleWeekProgressShare } from "@/components/share/muscle-week-progress-share";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MuscleBalanceBars } from "@/components/workout/muscle-balance-bars";
import { MuscleHeatGrid } from "@/components/workout/muscle-heat-grid";
import { MuscleScreenFigurePanel } from "@/components/workout/muscle-screen-figure-panel";
import { MuscleSelectedDetail } from "@/components/workout/muscle-selected-detail";
import {
  type MuscleHorizon,
  useMuscleScreen,
} from "@/components/workout/use-muscle-screen";
import { trackClientEvent } from "@/lib/analytics/client";
import type { MuscleId, VolumeBand } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleVolumeLegendSuffix,
  muscleVolumeSwatchStyle,
} from "@/lib/workout/muscle-heat-style";
import { VOLUME_BAND_LABELS } from "@/lib/workout/muscle-volume";

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

  useEffect(() => {
    if (selected && selected.view !== view) {
      setSelectedId(null);
    }
  }, [selected, setSelectedId, view]);

  const onSelectMuscle = useCallback(
    (id: MuscleId) => {
      setSelectedId(id);
      const cell = snapshot?.muscles.find((item) => item.id === id);
      if (cell) {
        setView(cell.view);
      }
      void trackClientEvent("muscle_map_action", {
        action: "select",
        muscle_id: id,
      });
    },
    [setSelectedId, setView, snapshot],
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Мышцы"
        subtitle="Подходы на каждую мышцу и как она восстановилась"
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
                { id: "volume", label: "Подходы" },
                { id: "recovery", label: "Восстановление" },
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

            <MuscleScreenFigurePanel
              since={snapshot.since}
              until={snapshot.until}
              muscles={snapshot.muscles}
              view={view}
              setView={setView}
              selectedId={selectedId}
              displayMode={displayMode}
              onSelect={onSelectMuscle}
              figureSex={snapshot.figure_sex}
              unmappedCount={snapshot.unmapped_exercise_count}
            />

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
                    {side === "front" ? "Спереди" : "Сзади"}
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
                Восстановление: выше % — мышца готова к тяжёлой работе. Крупные
                мышцы отходят дольше мелких.
              </p>
            )}

            <MuscleBalanceBars pairs={snapshot.balance} />

            {selected ? (
              <MuscleSelectedDetail cell={selected} hits={selectedHits} />
            ) : (
              <p className="px-1 text-sm text-muted-foreground">
                Выбери мышцу — покажем график по неделям и упражнения.
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
