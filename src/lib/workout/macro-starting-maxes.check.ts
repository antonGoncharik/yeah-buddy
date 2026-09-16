import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { resolveStartingPhaseMaxes } from "@/lib/workout/macro-starting-maxes";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

function exercise(
  id: string,
  max: number | null,
  preset: ExerciseWithMax["formula_preset"] = "barbell",
): ExerciseWithMax {
  return {
    id,
    user_id: "u",
    name: id,
    short_name: null,
    category: "base",
    workout_type: "dynamic",
    unit: "reps",
    weight_step: 2.5,
    formula_preset: preset,
    one_rm: null,
    slot: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    archived_at: null,
    current_max:
      max == null
        ? null
        : {
            id: `${id}-max`,
            user_id: "u",
            exercise_id: id,
            max_weight: max,
            achieved_at: "2026-01-01",
            phase_id: null,
            workout_session_id: null,
            created_at: "",
          },
    max_history: [],
    track: null,
  };
}

const squat = exercise("squat", 100);
const bench = exercise("bench", 80);
const curl = exercise("curl", null);
const plank = exercise("plank", null, "none");
const queue = new Set(["squat", "bench", "plank"]);

const resolved = resolveStartingPhaseMaxes([squat, bench, curl, plank], queue, [
  { exercise_id: "squat", max_weight: 90 },
]);
assertEqual(
  resolved.map((item) => `${item.exercise_id}:${item.max_weight}`).join(","),
  "squat:90,bench:80",
  "form weight wins, queue exercise falls back to current max, others skipped",
);

let thrown: string | null = null;
try {
  resolveStartingPhaseMaxes([squat, curl], new Set(["squat", "curl"]), []);
} catch (error) {
  thrown = error instanceof Error ? error.message : String(error);
}
assertEqual(
  thrown,
  NEED_ALL_WORKING_WEIGHTS,
  "queue exercise without any weight blocks the cycle",
);

assertEqual(
  resolveStartingPhaseMaxes([curl], new Set(), [
    { exercise_id: "curl", max_weight: 20 },
  ]).length,
  1,
  "an exercise outside the queue still gets a phase max when provided",
);

console.log("macro starting maxes ok");
