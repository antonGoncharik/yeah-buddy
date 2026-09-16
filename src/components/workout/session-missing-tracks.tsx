"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type { Exercise } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export interface MissingTrackInput {
  exercise_id: string;
  start_weight: number;
}

export function SessionMissingTracks({
  exercises,
  busy,
  onSave,
}: {
  exercises: Exercise[];
  busy: boolean;
  onSave: (tracks: MissingTrackInput[]) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const filled = exercises.flatMap((exercise) => {
    const weight = parseDecimal(values[exercise.id] ?? "");
    return weight != null && weight > 0
      ? [{ exercise_id: exercise.id, start_weight: weight }]
      : [];
  });

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-xl font-semibold tracking-tight">
          Первый рабочий вес
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Напиши килограммы на первый раз. Дальше вес пойдёт сам: после недели,
          если в цикле стоит прибавка, или после тренировки.
        </p>
      </div>
      <div className="divide-y divide-border/70" data-field-group>
        {exercises.map((exercise, index) => {
          const start = parseDecimal(values[exercise.id] ?? "");
          return (
            <div key={exercise.id} className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-3">
                <Label
                  htmlFor={`missing-track-${exercise.id}`}
                  className="min-w-0 flex-1 text-base font-medium"
                >
                  {exerciseShortLabel(exercise.short_name, exercise.name)}
                </Label>
                <Input
                  id={`missing-track-${exercise.id}`}
                  inputMode="decimal"
                  enterKeyHint={
                    index === exercises.length - 1 ? "done" : "next"
                  }
                  autoComplete="off"
                  placeholder="кг"
                  disabled={busy}
                  value={values[exercise.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [exercise.id]: event.target.value,
                    }))
                  }
                  onKeyDown={handleNumericEnter}
                  className="h-12 w-24 shrink-0 text-base tabular-nums"
                />
              </div>
              {start != null && start > 0 ? (
                <p className="text-sm tabular-nums text-muted-foreground">
                  {formatWeight(start)} кг · шаг{" "}
                  {formatWeight(exercise.weight_step)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy || filled.length === 0}
        onClick={() => void onSave(filled)}
      >
        {filled.length > 0 && filled.length < exercises.length
          ? "Начать заполненные линейки"
          : "Начать линейку"}
      </Button>
    </section>
  );
}
