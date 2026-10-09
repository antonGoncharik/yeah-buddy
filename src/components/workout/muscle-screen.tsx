"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";

import { DumbbellDoodle } from "@/components/layout/doodles";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MuscleBodyFigure } from "@/components/workout/muscle-body-figure";
import {
  type MuscleHorizon,
  useMuscleScreen,
} from "@/components/workout/use-muscle-screen";
import { formatIsoDate } from "@/lib/day/format";
import type { MuscleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTonnage } from "@/lib/workout/numbers";

const HORIZONS: Array<{ id: MuscleHorizon; label: string }> = [
  { id: "7", label: "7 дн" },
  { id: "14", label: "14" },
  { id: "30", label: "30" },
  { id: "90", label: "90" },
];

const STATUS_LEGEND: Array<{ status: MuscleStatus; label: string }> = [
  { status: "trained", label: "Был объём" },
  { status: "stale", label: "Давно" },
  { status: "missed", label: "Пропуск дня" },
  { status: "planned", label: "В очереди" },
];

function statusHint(status: MuscleStatus): string {
  switch (status) {
    case "trained":
      return "Есть рабочие подходы за период";
    case "stale":
      return "Было, но давно не трогали";
    case "missed":
      return "День с этой зоной пропустили";
    case "planned":
      return "Следующий день в очереди";
    default:
      return "За период почти не было нагрузки";
  }
}

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
    selectedId,
    setSelectedId,
    selected,
    selectedHits,
  } = useMuscleScreen();

  const touchStart = useRef<{ x: number; y: number } | null>(null);

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
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) {
        return;
      }
      setView(dx > 0 ? "front" : "back");
    },
    [setView],
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Мышцы"
        subtitle="Что качали и что выпало"
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
            <div
              className="card-surface flex flex-col gap-3 px-4 py-4"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {formatIsoDate(snapshot.since, "d MMM")} —{" "}
                  {formatIsoDate(snapshot.until, "d MMM")}
                </p>
                <Segmented
                  value={view}
                  options={[
                    { id: "front", label: "Спереди" },
                    { id: "back", label: "Сзади" },
                  ]}
                  onChange={setView}
                />
              </div>
              <MuscleBodyFigure
                view={view}
                muscles={snapshot.muscles}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <p className="text-center text-sm text-muted-foreground">
                Свайп влево или вправо — другой ракурс
              </p>
              {snapshot.planned_template_name ? (
                <p className="text-center text-sm leading-snug">
                  Дальше в очереди:{" "}
                  <span className="font-medium">
                    {snapshot.planned_template_name}
                  </span>
                </p>
              ) : null}
            </div>

            <ul className="flex flex-wrap gap-2 px-1">
              {STATUS_LEGEND.map((item) => (
                <li
                  key={item.status}
                  className="rounded-full bg-muted/80 px-3 py-1 text-sm text-muted-foreground"
                >
                  <LegendDot status={item.status} />
                  {item.label}
                </li>
              ))}
            </ul>

            {selected ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">{selected.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {statusHint(selected.status)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Подходы</dt>
                    <dd className="font-medium tabular-nums">
                      {selected.work_sets}
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
                  {selected.missed_sessions > 0 ? (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        Пропущенных дней
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
                        className="flex items-baseline justify-between gap-3 py-2"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {hit.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
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
                    Нет упражнений с рабочими подходами за период.
                  </p>
                )}
              </section>
            ) : (
              <p className="px-1 text-sm text-muted-foreground">
                Нажми на зону на схеме — покажем упражнения и даты.
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function LegendDot({ status }: { status: MuscleStatus }) {
  const className = cn(
    "mr-1.5 inline-block size-2.5 rounded-full align-middle",
    status === "trained" && "bg-primary",
    status === "stale" && "bg-primary/40",
    status === "missed" && "bg-destructive/80",
    status === "planned" && "ring-2 ring-primary bg-muted",
  );
  return <span className={className} aria-hidden />;
}
