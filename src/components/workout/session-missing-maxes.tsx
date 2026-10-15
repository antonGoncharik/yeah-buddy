"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleNumericEnter } from "@/lib/form/field-nav";
import {
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
} from "@/lib/form/numeric-draft";
import type { Exercise } from "@/lib/types";
import { estimateE1rm } from "@/lib/workout/e1rm";
import { floorToStep } from "@/lib/workout/formulas";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

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
  const [oneRm, setOneRm] = useState<Record<string, string>>({});
  const [workKg, setWorkKg] = useState<Record<string, string>>({});
  const [workReps, setWorkReps] = useState<Record<string, string>>({});

  const filled = exercises.flatMap((exercise) => {
    const direct = parseDecimal(oneRm[exercise.id] ?? "");
    if (direct != null && direct > 0) {
      return [{ exercise_id: exercise.id, max_weight: direct }];
    }
    const weight = parseDecimal(workKg[exercise.id] ?? "");
    const reps = Number.parseInt(workReps[exercise.id] ?? "", 10);
    if (
      weight == null ||
      weight <= 0 ||
      !Number.isFinite(reps) ||
      reps < 1 ||
      reps > 30
    ) {
      return [];
    }
    const estimated = estimateE1rm(weight, reps, null);
    if (estimated == null || !(estimated > 0)) {
      return [];
    }
    const step = exercise.weight_step > 0 ? exercise.weight_step : 2.5;
    return [
      {
        exercise_id: exercise.id,
        max_weight: floorToStep(estimated, step),
      },
    ];
  });

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-xl font-semibold tracking-tight">Ещё без плана</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Укажи максимум на раз или рабочий вес с повторами — от этого посчитаем
          подходы.
        </p>
      </div>
      <div className="flex flex-col gap-4" data-field-group>
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="flex flex-col gap-2 border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
          >
            <p className="text-base font-medium">
              {exerciseShortLabel(exercise.short_name, exercise.name)}
            </p>
            <div className="flex items-center gap-3">
              <Label
                htmlFor={`missing-max-${exercise.id}`}
                className="min-w-0 flex-1 text-sm text-muted-foreground"
              >
                На раз, кг
              </Label>
              <Input
                id={`missing-max-${exercise.id}`}
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                placeholder="кг"
                disabled={busy}
                value={oneRm[exercise.id] ?? ""}
                onChange={(event) =>
                  setOneRm((current) => ({
                    ...current,
                    [exercise.id]: sanitizeDecimalDraft(event.target.value),
                  }))
                }
                onKeyDown={handleNumericEnter}
                className="h-12 w-24 shrink-0 text-base tabular-nums"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                или рабочий × повторы
              </span>
              <Input
                aria-label={`Рабочий вес, ${exerciseShortLabel(exercise.short_name, exercise.name)}`}
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                placeholder="кг"
                disabled={busy}
                value={workKg[exercise.id] ?? ""}
                onChange={(event) =>
                  setWorkKg((current) => ({
                    ...current,
                    [exercise.id]: sanitizeDecimalDraft(event.target.value),
                  }))
                }
                onKeyDown={handleNumericEnter}
                className="h-12 w-20 shrink-0 text-base tabular-nums"
              />
              <span className="text-muted-foreground">×</span>
              <Input
                aria-label={`Повторы, ${exerciseShortLabel(exercise.short_name, exercise.name)}`}
                inputMode="numeric"
                enterKeyHint={index === exercises.length - 1 ? "done" : "next"}
                autoComplete="off"
                placeholder="раз"
                disabled={busy}
                value={workReps[exercise.id] ?? ""}
                onChange={(event) =>
                  setWorkReps((current) => ({
                    ...current,
                    [exercise.id]: sanitizeIntegerDraft(event.target.value),
                  }))
                }
                onKeyDown={handleNumericEnter}
                className="h-12 w-16 shrink-0 text-base tabular-nums"
              />
            </div>
            {(() => {
              const weight = parseDecimal(workKg[exercise.id] ?? "");
              const reps = Number.parseInt(workReps[exercise.id] ?? "", 10);
              if (
                weight == null ||
                weight <= 0 ||
                !Number.isFinite(reps) ||
                reps < 1
              ) {
                return null;
              }
              const estimated = estimateE1rm(weight, reps, null);
              if (estimated == null || !(estimated > 0)) {
                return null;
              }
              const step =
                exercise.weight_step > 0 ? exercise.weight_step : 2.5;
              const rounded = floorToStep(estimated, step);
              return (
                <p className="text-sm text-muted-foreground tabular-nums">
                  ≈ {formatWeight(rounded)} кг на раз
                </p>
              );
            })()}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy || filled.length === 0}
        onClick={() => void onSave(filled)}
      >
        {busy
          ? "Сохраняю…"
          : filled.length > 0 && filled.length < exercises.length
            ? "Добавить в план заполненные"
            : "Добавить в план"}
      </Button>
    </section>
  );
}
