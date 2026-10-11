"use client";

import Link from "next/link";
import { useMemo } from "react";

import { MuscleBodyFigure } from "@/components/workout/muscle-body-figure";
import type { UserSex } from "@/lib/types";
import type { SessionExerciseDetail } from "@/lib/types/workout-session";
import {
  sessionMuscleCells,
  sessionMuscleFigureSex,
} from "@/lib/workout/session-muscle-cells";

export function SessionMuscleMini({
  exercises,
  figureSex,
}: {
  exercises: SessionExerciseDetail[];
  figureSex?: UserSex | null;
}) {
  const cells = useMemo(() => sessionMuscleCells(exercises), [exercises]);
  if (cells.length === 0) {
    return null;
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">Сегодня нагрузили</p>
          <p className="text-sm text-muted-foreground">
            По рабочим подходам этой тренировки.
          </p>
        </div>
        <Link
          href="/workouts/muscles"
          className="text-sm font-medium text-primary"
        >
          Карта
        </Link>
      </div>
      <MuscleBodyFigure
        view="front"
        muscles={cells}
        selectedId={null}
        displayMode="volume"
        onSelect={() => {}}
        compact
        figureSex={sessionMuscleFigureSex(figureSex)}
      />
    </section>
  );
}
