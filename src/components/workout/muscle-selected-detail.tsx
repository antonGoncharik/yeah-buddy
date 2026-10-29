"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { MuscleWeeklySparkline } from "@/components/workout/muscle-weekly-sparkline";
import { formatIsoDate } from "@/lib/day/format";
import { pluralSets } from "@/lib/i18n/plural";
import type { MuscleCell, MuscleExerciseHit } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleBandLabel,
  muscleCellHint,
} from "@/lib/workout/muscle-heat-style";
import { setsShortOfGrowthZone } from "@/lib/workout/muscle-insights";
import {
  formatMuscleSetCount,
  muscleShortfallLine,
} from "@/lib/workout/muscle-screen-copy";
import { muscleVolumeLandmarkLine } from "@/lib/workout/muscle-volume-landmarks";
import { formatTonnage } from "@/lib/workout/numbers";

export function MuscleSelectedDetail({
  cell,
  hits,
}: {
  cell: MuscleCell;
  hits: MuscleExerciseHit[];
}) {
  const shortfall = setsShortOfGrowthZone(cell);

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{cell.label}</h2>
        <p className="text-sm text-muted-foreground">{muscleCellHint(cell)}</p>
      </div>
      <MuscleWeeklySparkline cell={cell} />
      <p className="text-sm text-muted-foreground">
        {muscleVolumeLandmarkLine(cell.id)}
      </p>
      {shortfall != null ? (
        <p className="text-sm text-muted-foreground">
          {muscleShortfallLine(shortfall)}
        </p>
      ) : null}
      <MuscleSelectedActions cell={cell} />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {cell.direct_sets > 0 || cell.assist_sets > 0 ? (
          <>
            <div>
              <dt className="text-muted-foreground">На эту мышцу</dt>
              <dd className="font-medium tabular-nums">
                {formatMuscleSetCount(cell.direct_sets)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Заодно</dt>
              <dd className="font-medium tabular-nums">
                {formatMuscleSetCount(cell.assist_sets)}
              </dd>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              На эту мышцу — где она главная. Заодно — где только помогает, как
              трицепс в жиме.
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-muted-foreground">В неделю</dt>
          <dd className="font-medium tabular-nums">
            ~{cell.sets_per_week} · {muscleBandLabel(cell.volume_band)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Последний раз</dt>
          <dd className="font-medium">
            {cell.last_trained
              ? formatIsoDate(cell.last_trained, "d MMM")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Восстановление</dt>
          <dd className="font-medium">
            {cell.recovery_percent != null
              ? `~${cell.recovery_percent}%`
              : cell.days_since != null
                ? `${cell.days_since} дн назад`
                : "—"}
          </dd>
        </div>
        {cell.missed_sessions > 0 ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Пропущено тренировок</dt>
            <dd className="font-medium tabular-nums">{cell.missed_sessions}</dd>
          </div>
        ) : null}
      </dl>
      {hits.length > 0 ? (
        <ol className="divide-y divide-border/70 text-sm">
          {hits.map((hit) => (
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
                {formatMuscleSetCount(hit.sets)} {pluralSets(hit.sets)} ·{" "}
                {formatIsoDate(hit.last_date, "d MMM")}
                {hit.tonnage > 0 ? ` · ${formatTonnage(hit.tonnage)}` : null}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          За этот период на эту мышцу упражнений не было.
        </p>
      )}
    </section>
  );
}

function MuscleSelectedActions({ cell }: { cell: MuscleCell }) {
  return (
    <div className="flex flex-col gap-2">
      {cell.in_next_session ? (
        <Link href="/workouts" className={cn(buttonVariants(), "h-11 w-full")}>
          В следующей тренировке
        </Link>
      ) : null}
      <Link
        href={`/workouts/exercises?muscle=${cell.id}`}
        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}
      >
        Упражнения на эту мышцу
      </Link>
    </div>
  );
}
