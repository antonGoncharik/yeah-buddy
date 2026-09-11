"use client";

import type { Dispatch, SetStateAction } from "react";

import { nativeSelectClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import type { ExerciseFormState } from "@/components/workout/exercise-form-state";
import type { FormulaPreset } from "@/lib/types";
import {
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_WORKOUT_TYPE_LABELS,
  EXERCISE_WORKOUT_TYPES,
  FORMULA_PRESET_LABELS,
  FORMULA_PRESETS,
  WEIGHT_STEP_OPTIONS,
} from "@/lib/workout/labels";
import { isFormulaPreset } from "@/lib/workout/map-rows";

export function ExerciseTypeFields({
  form,
  setForm,
}: {
  form: ExerciseFormState;
  setForm: Dispatch<SetStateAction<ExerciseFormState>>;
}) {
  return (
    <>
      <Field label="Тип">
        <Segmented
          value={form.workout_type}
          options={EXERCISE_WORKOUT_TYPES.map((type) => ({
            id: type,
            label: EXERCISE_WORKOUT_TYPE_LABELS[type],
          }))}
          onChange={(workout_type) =>
            setForm((current) => ({
              ...current,
              workout_type,
              ...(workout_type === "both" || workout_type === "static"
                ? { weight_step: 1, formula_preset: "cable" as const }
                : current.workout_type === "both" ||
                    current.workout_type === "static"
                  ? { weight_step: 2.5, formula_preset: "barbell" as const }
                  : {}),
            }))
          }
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сколько раз или сколько секунд. «И то и то» — оба.
        </p>
      </Field>

      <Field label="Категория">
        <Segmented
          value={form.category === "isolation" ? "isolation" : "base"}
          options={[
            { id: "base", label: EXERCISE_CATEGORY_LABELS.base },
            { id: "isolation", label: EXERCISE_CATEGORY_LABELS.isolation },
          ]}
          onChange={(category) =>
            setForm((current) => ({
              ...current,
              category: category as "base" | "isolation",
            }))
          }
        />
      </Field>

      <Field label="Шаг веса">
        <Segmented
          value={String(form.weight_step)}
          options={WEIGHT_STEP_OPTIONS.map((step) => ({
            id: String(step),
            label: `${step} кг`,
          }))}
          onChange={(step) =>
            setForm((current) => ({
              ...current,
              weight_step: Number(step),
            }))
          }
        />
      </Field>

      <Field label="Разминка">
        <select
          value={form.formula_preset}
          onChange={(event) => {
            const preset = event.target.value;
            if (!isFormulaPreset(preset)) {
              return;
            }
            setForm((current) => ({
              ...current,
              formula_preset: preset,
            }));
          }}
          className={nativeSelectClassName}
        >
          {FORMULA_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {FORMULA_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>
        <p className="text-base leading-relaxed text-muted-foreground">
          {warmupHint(form.formula_preset)}
        </p>
      </Field>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
    </div>
  );
}

function warmupHint(preset: FormulaPreset): string {
  if (preset === "barbell") {
    return "Как у штанги.";
  }
  if (preset === "cable") {
    return "Как у блока.";
  }
  return "В план не попадёт — нет процентов.";
}
