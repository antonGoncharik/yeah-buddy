"use client";

import { useMemo } from "react";

import { MuscleBodyFigure } from "@/components/workout/muscle-body-figure";
import {
  programMusclePreview,
  programMusclePreviewCells,
} from "@/lib/workout/program-muscle-preview";
import type { ProgramPresetId } from "@/lib/workout/program-presets";

export function ProgramMusclePreview({
  presetId,
  figureSex = null,
}: {
  presetId: ProgramPresetId;
  figureSex?: "male" | "female" | null;
}) {
  const rows = useMemo(() => programMusclePreview(presetId), [presetId]);
  const cells = useMemo(() => programMusclePreviewCells(rows), [rows]);

  if (rows.length === 0) {
    return null;
  }

  const top = rows.slice(0, 5);

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <h2 className="text-lg font-semibold">Мышцы в неделю</h2>
      <p className="text-sm text-muted-foreground">
        Прикидка по упражнениям программы — прямые подходы в неделю.
      </p>
      <MuscleBodyFigure
        view="front"
        muscles={cells}
        selectedId={null}
        displayMode="volume"
        onSelect={() => {}}
        compact
        figureSex={figureSex}
      />
      <ul className="flex flex-col gap-1 text-sm tabular-nums">
        {top.map((row) => (
          <li key={row.id} className="flex justify-between gap-3">
            <span>{row.label}</span>
            <span className="font-medium">~{row.sets_per_week} подх.</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
