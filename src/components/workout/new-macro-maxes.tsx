"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleNumericEnter } from "@/lib/form/field-nav";
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
    <section className="flex flex-col gap-3" data-field-group>
      <h2 className="text-xl font-semibold">1ПМ на цикл</h2>
      <p className="text-sm text-muted-foreground">
        Упражнения из программы, с этих максимумов начнётся цикл. Подставлены
        текущие. Если давно не тренировался — поставь меньше.
      </p>
      {exercises.map((exercise, index) => (
        <div key={exercise.id} className="flex flex-col gap-2">
          <Label className="text-base">
            {exercise.short_name || exercise.name}
          </Label>
          <Input
            required
            inputMode="decimal"
            enterKeyHint={index === exercises.length - 1 ? "done" : "next"}
            value={maxes[exercise.id] ?? ""}
            onChange={(event) => onChange(exercise.id, event.target.value)}
            onKeyDown={handleNumericEnter}
            className="h-12 text-base"
          />
        </div>
      ))}
    </section>
  );
}
