"use client";

import { Button } from "@/components/ui/button";
import { SessionMissingMaxRow } from "@/components/workout/session-missing-max-row";
import { useSessionMissingMaxesForm } from "@/components/workout/use-session-missing-maxes-form";
import type { Exercise } from "@/lib/types";
import { partialFormSaveLabel } from "@/lib/workout/partial-form-save-label";

export function SessionMissingMaxes({
  exercises,
  busy,
  onSave,
}: {
  exercises: Exercise[];
  busy: boolean;
  onSave: (
    maxes: Array<{ exercise_id: string; max_weight: number }>,
  ) => Promise<void>;
}) {
  const form = useSessionMissingMaxesForm(exercises);
  const lastIndex = exercises.length - 1;

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-xl font-semibold tracking-tight">Ещё без плана</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Сколько поднимаешь один раз. Не знаешь точно — напиши вес и повторы,
          посчитаем «на раз».
        </p>
      </div>
      <div className="flex flex-col gap-4" data-field-group>
        {exercises.map((exercise, index) => (
          <SessionMissingMaxRow
            key={exercise.id}
            exercise={exercise}
            index={index}
            lastIndex={lastIndex}
            busy={busy}
            oneRm={form.oneRm}
            workKg={form.workKg}
            workReps={form.workReps}
            setOneRm={form.setOneRm}
            setWorkKg={form.setWorkKg}
            setWorkReps={form.setWorkReps}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy || form.filled.length === 0}
        onClick={() => void onSave(form.filled)}
      >
        {partialFormSaveLabel(busy, form.filled.length, exercises.length, {
          saving: "Сохраняю…",
          partial: "Добавить в план заполненные",
          all: "Добавить в план",
        })}
      </Button>
    </section>
  );
}
