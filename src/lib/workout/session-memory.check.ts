import type { WorkoutSet } from "@/lib/types";
import {
  formatPreviousWorkLine,
  previousWorkFromSets,
  shouldHoldWeights,
} from "@/lib/workout/session-memory";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function workSet(patch: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: "s",
    user_id: "u",
    session_exercise_id: "e",
    set_type: "work",
    set_number: 1,
    planned_weight: 80,
    planned_reps: 5,
    planned_seconds: null,
    actual_weight: 80,
    actual_reps: 5,
    actual_seconds: null,
    is_completed: true,
    created_at: "",
    ...patch,
  };
}

assertEqual(
  formatPreviousWorkLine({
    weight: 80,
    reps: 5,
    seconds: null,
    feel: "close",
  }),
  "прошлый: 80×5, было впритык",
  "close feel on last work",
);

assertEqual(
  formatPreviousWorkLine({
    weight: 80,
    reps: 5,
    seconds: null,
    feel: null,
  }),
  "прошлый: 80×5",
  "no feel keeps the set",
);

assertEqual(
  formatPreviousWorkLine({
    weight: 87,
    reps: null,
    seconds: 6,
    feel: "easy",
  }),
  "прошлый: 87×6с, было легко",
  "static previous",
);

assertEqual(
  previousWorkFromSets(
    [
      workSet({ set_type: "warmup", planned_weight: 50, actual_weight: 50 }),
      workSet({ actual_weight: 82.5, actual_reps: 4 }),
    ],
    "miss",
  ),
  {
    weight: 82.5,
    reps: 4,
    seconds: null,
    feel: "miss",
  },
  "first work actual plus feel",
);

assertEqual(
  previousWorkFromSets([workSet({ set_type: "warmup" })], "close"),
  null,
  "warmup only is not previous work",
);

assertEqual(shouldHoldWeights(["miss", "miss"]), true, "two misses hold");

assertEqual(shouldHoldWeights(["miss"]), false, "one miss is not a series");

assertEqual(
  shouldHoldWeights(["miss", "close", "miss"]),
  false,
  "close breaks the series",
);

assertEqual(
  shouldHoldWeights(["easy", "miss", "miss"]),
  true,
  "last two misses hold",
);

assertEqual(shouldHoldWeights([null, "miss"]), false, "null feel breaks hold");

console.log("session memory ok");
