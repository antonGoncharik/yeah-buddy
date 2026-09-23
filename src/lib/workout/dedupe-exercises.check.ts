import {
  type DedupeExerciseCandidate,
  exerciseNameKey,
  pickExerciseKeeper,
  STARTER_EXERCISE_NAME_KEYS,
} from "@/lib/workout/dedupe-exercises";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  STARTER_EXERCISE_NAME_KEYS.size === STARTER_EXERCISES.length,
  "starter name keys must cover every starter lift",
);
assert(
  STARTER_EXERCISE_NAME_KEYS.has(exerciseNameKey("Приседания со штангой")),
  "squat full name is a starter key",
);
assert(
  !STARTER_EXERCISE_NAME_KEYS.has(exerciseNameKey("присед")),
  "short name alone must not count as a starter key",
);

const base: Omit<
  DedupeExerciseCandidate,
  "id" | "has_max" | "in_template" | "is_active" | "created_at"
> = {
  name: "Приседания со штангой",
};

const withMax = pickExerciseKeeper([
  {
    ...base,
    id: "a",
    has_max: false,
    in_template: true,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    ...base,
    id: "b",
    has_max: true,
    in_template: false,
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
  },
]);
assert(withMax.id === "b", "prefer the lift that has a max");

const withTemplate = pickExerciseKeeper([
  {
    ...base,
    id: "a",
    has_max: false,
    in_template: false,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    ...base,
    id: "b",
    has_max: false,
    in_template: true,
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
  },
]);
assert(withTemplate.id === "b", "prefer the lift that is in a template");

const older = pickExerciseKeeper([
  {
    ...base,
    id: "newer",
    has_max: false,
    in_template: false,
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    ...base,
    id: "older",
    has_max: false,
    in_template: false,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
]);
assert(older.id === "older", "prefer the older row when ties remain");

console.log("dedupe exercises ok");
