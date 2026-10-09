"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import type { ExerciseFormState } from "@/components/workout/exercise-form-state";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import { ExerciseTrackCard } from "@/components/workout/exercise-track-card";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

function maxWeightOutOfRange(raw: string): boolean {
  if (raw.trim() === "") {
    return false;
  }
  const parsed = parseDecimal(raw);
  return parsed == null || parsed <= 0 || parsed > 1000;
}

export function ExerciseLoadsSection({
  exercise,
  form,
  setForm,
  canCorrectMax,
}: {
  exercise: ExerciseWithMax;
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  canCorrectMax: boolean;
}) {
  const maxLocked = !canCorrectMax;

  return (
    <section className="card-surface flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Веса</h2>
        <p className="text-sm leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">На раз</span> — от него
          считаются проценты в плане.{" "}
          <span className="font-medium text-foreground">Рабочий</span> — только
          если в подходе стоит «Кг», не проценты. Это разные числа.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4">
        <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
          <p className="text-sm font-medium">На раз, кг</p>
          {maxLocked ? (
            <>
              <Input
                readOnly
                tabIndex={-1}
                aria-label="Максимум на раз, кг"
                value={
                  exercise.current_max
                    ? formatWeight(exercise.current_max.max_weight)
                    : ""
                }
                className={EXERCISE_LOAD_INPUT_CLASS}
              />
              <p className="text-xs leading-snug text-muted-foreground">
                Идёт цикл — меняется в «Недели».
              </p>
            </>
          ) : (
            <>
              <Input
                required
                aria-label="Максимум на раз, кг"
                inputMode="decimal"
                enterKeyHint="done"
                value={form.max_weight}
                aria-invalid={maxWeightOutOfRange(form.max_weight) || undefined}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    max_weight: sanitizeDecimalDraft(event.target.value),
                  }))
                }
                onKeyDown={handleNumericEnter}
                className={EXERCISE_LOAD_INPUT_CLASS}
              />
              {maxWeightOutOfRange(form.max_weight) ? (
                <p className="text-xs text-destructive">0,1–1000 кг</p>
              ) : null}
            </>
          )}
        </div>

        <ExerciseTrackCard exercise={exercise} embedded />
      </div>
    </section>
  );
}

export function ExerciseLoadsSectionNew({
  form,
  setForm,
}: {
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
}) {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">На раз, кг</h2>
        <p className="text-sm text-muted-foreground">
          От этого максимума считаются проценты в подходах.
        </p>
      </div>
      <Input
        required
        inputMode="decimal"
        enterKeyHint="done"
        value={form.max_weight}
        aria-invalid={maxWeightOutOfRange(form.max_weight) || undefined}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            max_weight: sanitizeDecimalDraft(event.target.value),
          }))
        }
        onKeyDown={handleNumericEnter}
        className={EXERCISE_LOAD_INPUT_CLASS}
      />
      {maxWeightOutOfRange(form.max_weight) ? (
        <p className="text-base leading-snug text-destructive">
          Вес от 0,1 до 1000 кг.
        </p>
      ) : null}
    </section>
  );
}
