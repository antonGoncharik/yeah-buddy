"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExerciseWithMax } from "@/lib/types";

export function NewMacroMaxes({
  exercises,
  maxes,
  onChange,
}: {
  exercises: ExerciseWithMax[];
  maxes: Record<string, string>;
  onChange: (exerciseId: string, value: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Твои веса</h2>
      <p className="text-sm text-muted-foreground">
        Стоят рекорды. Если давно не жалось — поставь меньше.
      </p>
      {exercises.map((exercise) => (
        <div key={exercise.id} className="flex flex-col gap-2">
          <Label className="text-base">
            {exercise.short_name || exercise.name}
          </Label>
          <Input
            required
            inputMode="decimal"
            value={maxes[exercise.id] ?? ""}
            onChange={(event) => onChange(exercise.id, event.target.value)}
            className="h-12 text-base"
          />
        </div>
      ))}
    </section>
  );
}
