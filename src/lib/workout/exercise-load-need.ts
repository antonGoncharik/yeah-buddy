import type {
  Exercise,
  ExerciseWorkoutType,
  FormulaPreset,
  TemplateSlot,
} from "@/lib/types";
import { slotNeedsMax, slotNeedsTrack } from "@/lib/workout/slot-plan";

export type ExerciseLoadNeed = {
  max: boolean;
  track: boolean;
};

type LoadTemplate = {
  is_active: boolean;
  exercises: Array<Pick<Exercise, "id" | "formula_preset">>;
  slots: TemplateSlot[];
};

/** Which number this exercise's days actually use. Null templates = not loaded yet. */
export function exerciseLoadNeed(
  exercise: Pick<Exercise, "id" | "formula_preset">,
  templates: LoadTemplate[] | null,
): ExerciseLoadNeed {
  if (templates == null) {
    return unseenNeed(exercise.formula_preset);
  }

  let seen = false;
  let max = false;
  let track = false;
  for (const template of templates) {
    if (!template.is_active) {
      continue;
    }
    for (const [index, row] of template.exercises.entries()) {
      if (row.id !== exercise.id) {
        continue;
      }
      seen = true;
      const plan = template.slots[index]?.plan ?? null;
      if (slotNeedsMax(plan, row)) {
        max = true;
      }
      if (slotNeedsTrack(plan)) {
        track = true;
      }
    }
  }

  if (!seen) {
    return unseenNeed(exercise.formula_preset);
  }

  return { max, track };
}

function unseenNeed(preset: FormulaPreset): ExerciseLoadNeed {
  return { max: preset !== "none", track: false };
}

/** One sentence for the weight card: what the number is, and where warmup comes from. */
export function exerciseWeightLead(input: {
  need: ExerciseLoadNeed;
  preset: FormulaPreset;
  workoutType: ExerciseWorkoutType;
}): string {
  const ramp = warmupRamp(input.preset);
  if (!input.need.max && !input.need.track) {
    return "В днях программы вес задан сам. Отдельная цифра тут не нужна.";
  }
  if (input.need.max && input.need.track) {
    return "«На раз» — проценты. «На штанге» — лесенка, плюс шаг. Разминка — доли сегодняшнего подхода.";
  }
  if (input.need.track) {
    return ramp
      ? `Килограммы на штанге. Дальше плюс шаг. Разминка — ${ramp} от этого веса.`
      : "Килограммы на штанге. Дальше плюс шаг. Разминка — доли этого веса.";
  }
  if (input.workoutType === "static") {
    return "Удержания и короткая разминка на время — от этого числа. Разминка в повторах — от сегодняшнего подхода.";
  }
  return ramp
    ? `От этого числа проценты подходов. Разминка — ${ramp} от сегодняшнего подхода, не от этой цифры.`
    : "От этого числа проценты подходов. Разминка — доли сегодняшнего подхода, не от этой цифры.";
}

export const EXERCISE_WEIGHT_NEW_LEAD =
  "Сколько поднимаешь один раз. Лесенку спросим, только если день прибавляет килограммы, а не проценты.";

function warmupRamp(preset: FormulaPreset): string | null {
  if (preset === "barbell") {
    return "50, 70, 80 и 90%";
  }
  if (preset === "cable") {
    return "50 и 75%";
  }
  return null;
}
