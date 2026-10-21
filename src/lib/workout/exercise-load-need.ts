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
    return ramp
      ? `«На раз» — для подходов в процентах. «Рабочий» — для подходов в килограммах. Разминка — ${ramp} от рабочего подхода этого дня.`
      : "«На раз» — для подходов в процентах. «Рабочий» — для подходов в килограммах. Разминка — доли рабочего подхода этого дня.";
  }
  if (input.need.track) {
    return ramp
      ? `Это вес рабочих подходов. Разминка — ${ramp} от него.`
      : "Это вес рабочих подходов. Разминка — доли этого веса.";
  }
  if (input.workoutType === "static") {
    return "Удержания и короткая разминка на время — от этого числа. Разминка в повторах — от рабочего подхода этого дня.";
  }
  return ramp
    ? `Рабочие подходы — процент от этого числа. Разминка — ${ramp} от уже посчитанного рабочего подхода, не от этой цифры.`
    : "Рабочие подходы — процент от этого числа. Разминка — доли уже посчитанного рабочего подхода, не от этой цифры.";
}

export const EXERCISE_WEIGHT_NEW_LEAD =
  "Сколько поднимаешь один раз. Рабочий вес спросим только если день просит килограммы, не проценты.";

function warmupRamp(preset: FormulaPreset): string | null {
  if (preset === "barbell") {
    return "50, 70, 80 и 90%";
  }
  if (preset === "cable") {
    return "50 и 75%";
  }
  return null;
}
