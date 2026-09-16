import type {
  ExerciseCategory,
  ExerciseWithMax,
  ExerciseWorkoutType,
  FormulaPreset,
} from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export interface ExerciseFormState {
  name: string;
  short_name: string;
  workout_type: ExerciseWorkoutType;
  category: ExerciseCategory;
  weight_step: number;
  formula_preset: FormulaPreset;
  max_weight: string;
}

export function toFormState(exercise?: ExerciseWithMax): ExerciseFormState {
  return {
    name: exercise?.name ?? "",
    short_name: exercise?.short_name ?? "",
    workout_type: exercise?.workout_type ?? "dynamic",
    category: exercise?.category === "isolation" ? "isolation" : "base",
    weight_step: exercise?.weight_step ?? 2.5,
    formula_preset: exercise?.formula_preset ?? "barbell",
    max_weight: exercise?.current_max
      ? formatWeight(exercise.current_max.max_weight)
      : "",
  };
}

export function toPayload(
  form: ExerciseFormState,
  isEdit: boolean,
  canCorrectMax: boolean,
) {
  if (!form.name.trim()) {
    return null;
  }

  const category: ExerciseCategory =
    form.category === "isolation" ? "isolation" : "base";
  const unit = form.workout_type === "static" ? "seconds" : "reps";
  const shared = {
    name: form.name.trim(),
    short_name: form.short_name.trim() === "" ? null : form.short_name.trim(),
    category,
    workout_type: form.workout_type,
    unit,
    weight_step: form.weight_step,
    formula_preset: form.formula_preset,
  };

  if (isEdit && !canCorrectMax) {
    return shared;
  }

  const maxWeight = parseDecimal(form.max_weight);
  if (maxWeight == null || maxWeight <= 0) {
    return null;
  }

  return {
    ...shared,
    max_weight: maxWeight,
  };
}
