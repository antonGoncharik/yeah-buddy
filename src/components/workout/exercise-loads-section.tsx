"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import type { ExerciseFormState } from "@/components/workout/exercise-form-state";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import { ExerciseTrackCard } from "@/components/workout/exercise-track-card";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { ExerciseWithMax } from "@/lib/types";
import {
  EXERCISE_WEIGHT_NEW_LEAD,
  type ExerciseLoadNeed,
  exerciseWeightLead,
} from "@/lib/workout/exercise-load-need";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { ONE_REP_FIELD } from "@/lib/workout/user-copy";

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
  need,
}: {
  exercise: ExerciseWithMax;
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  canCorrectMax: boolean;
  need: ExerciseLoadNeed;
}) {
  const maxLocked = !canCorrectMax;
  const lead = exerciseWeightLead({
    need,
    preset: exercise.formula_preset,
    workoutType: exercise.workout_type,
  });

  return (
    <section className="card-surface flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {need.max && need.track ? "Веса" : "Вес"}
        </h2>
        <p className="text-sm leading-snug text-muted-foreground">{lead}</p>
      </div>

      {need.max || need.track ? (
        <div
          className={
            need.max && need.track
              ? "grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4"
              : "flex flex-col gap-3"
          }
        >
          {need.max ? (
            <MaxField
              exercise={exercise}
              form={form}
              setForm={setForm}
              locked={maxLocked}
            />
          ) : null}
          {need.track ? (
            <ExerciseTrackCard exercise={exercise} embedded />
          ) : null}
        </div>
      ) : null}
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
  if (form.formula_preset === "none") {
    return null;
  }

  return (
    <section className="card-surface flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Вес</h2>
        <p className="text-sm leading-snug text-muted-foreground">
          {EXERCISE_WEIGHT_NEW_LEAD}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
        <p className="text-sm font-medium">{ONE_REP_FIELD}</p>
        <MaxDraft form={form} setForm={setForm} optional />
      </div>
    </section>
  );
}

function MaxField({
  exercise,
  form,
  setForm,
  locked,
}: {
  exercise: ExerciseWithMax;
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  locked: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
      <p className="text-sm font-medium">{ONE_REP_FIELD}</p>
      {locked ? (
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
        <MaxDraft form={form} setForm={setForm} />
      )}
    </div>
  );
}

function MaxDraft({
  form,
  setForm,
  optional = false,
}: {
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
  optional?: boolean;
}) {
  return (
    <>
      <Input
        aria-label="Максимум на раз, кг"
        inputMode="decimal"
        enterKeyHint="done"
        placeholder={optional ? "необязательно" : undefined}
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
  );
}
