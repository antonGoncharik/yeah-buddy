import {
  defaultOnboardingCircle,
  exercisesForCircle,
  isExtraProgram,
  onboardingWeightExercises,
  scaledTemplateGrams,
} from "@/lib/onboarding-setup";
import type { ExerciseWithMax } from "@/lib/types";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  RECOMMENDED_PROGRAM_PRESET_ID === "full_body",
  "recommended start is full body",
);
assert(
  defaultOnboardingCircle("empty", false) === "full_body",
  "empty first run picks full body",
);
assert(
  defaultOnboardingCircle("empty", true) === "empty",
  "replay keeps empty circle",
);
assert(
  defaultOnboardingCircle("ppl", false) === "ppl",
  "existing program stays",
);
assert(!isExtraProgram("full_body"), "full body is beginner");
assert(isExtraProgram("ppl"), "ppl is extra");
assert(!isExtraProgram("empty"), "empty is not extra");

const squat = exercise("Приседания со штангой", "base");
const curls = exercise("Молотковый подъём", "isolation");
const bench = exercise("Жим лёжа", "base");

assert(
  exercisesForCircle("one_day", [squat, curls, bench])
    .map((item) => item.name)
    .join() === "Приседания со штангой,Жим лёжа",
  "circle keeps program order",
);
const maxes = onboardingWeightExercises("ppl", [squat, curls, bench]);
assert(maxes.length === 2, "two base lifts");
assert(
  maxes.every((item) => item.category === "base"),
  "onboarding maxes skip isolation",
);
assert(
  !maxes.some((item) => item.name === curls.name),
  "curls stay off the max list",
);
assert(
  onboardingWeightExercises("empty", [squat]).length === 0,
  "empty circle has no maxes",
);

assert(
  scaledTemplateGrams(
    [
      { id: "a", grams: 100, protein: 50 },
      { id: "b", grams: 100, protein: 50 },
    ],
    100,
  ).length === 0,
  "same protein does not rewrite meals",
);

const scaled = scaledTemplateGrams(
  [
    { id: "a", grams: 100, protein: 50 },
    { id: "b", grams: 100, protein: 50 },
  ],
  150,
);
assert(scaled.length === 2, "scales both items");
assert(scaled[0]?.grams === 150 && scaled[1]?.grams === 150, "1.5x portions");

assert(
  scaledTemplateGrams([{ id: "oil", grams: 10, protein: 0 }], 150).length === 0,
  "no protein — no scale",
);

console.log("onboarding setup ok");

function exercise(
  name: string,
  category: "base" | "isolation",
): ExerciseWithMax {
  return {
    id: name,
    user_id: "u",
    name,
    short_name: name,
    category,
    workout_type: "dynamic",
    unit: "reps",
    weight_step: 2.5,
    formula_preset: "barbell",
    slot: "a",
    is_active: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    archived_at: null,
    current_max: null,
    max_history: [],
  };
}
