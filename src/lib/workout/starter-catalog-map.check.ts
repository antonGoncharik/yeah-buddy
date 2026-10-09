import { exerciseNameKey } from "@/lib/workout/dedupe-exercises";
import {
  assertStarterCatalogMapComplete,
  starterSourceExerciseId,
} from "@/lib/workout/starter-catalog-map";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}, got ${String(actual)}`);
  }
}

assertStarterCatalogMapComplete();

assertEqual(
  starterSourceExerciseId("Жим лёжа"),
  "0025",
  "bench starter maps to catalog id",
);

assertEqual(
  starterSourceExerciseId("несуществующее"),
  null,
  "unknown starter has no catalog id",
);

const ids = STARTER_EXERCISES.map((item) => starterSourceExerciseId(item.name));
assert(
  ids.every((id) => typeof id === "string" && /^\d{4}$/.test(id)),
  "catalog source ids are four digits",
);

assertEqual(
  new Set(ids).size,
  STARTER_EXERCISES.length,
  "every starter maps to a unique catalog source id",
);

assertEqual(
  exerciseNameKey("Жим лёжа"),
  exerciseNameKey("жим лёжа"),
  "starter lookup is case-insensitive via name key",
);
