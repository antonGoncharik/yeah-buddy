import {
  applyCompoundGluteTargetFix,
  foldExerciseName,
  mapCatalogSecondary,
  mapCatalogTarget,
  mapDeltsFromName,
} from "@/lib/workout/muscle-catalog-map";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import type { ExerciseMuscleMeta } from "@/lib/workout/muscle-aggregate";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

assertEqual(
  mapCatalogTarget("pectorals", foldExerciseName("bench press")),
  "chest",
  "pectorals",
);
assertEqual(
  mapDeltsFromName(foldExerciseName("dumbbell rear fly")),
  "rear_delts",
  "rear fly delts",
);
assertEqual(
  mapDeltsFromName(foldExerciseName("lateral raise")),
  "side_delts",
  "lateral delts",
);

const squatGlute = applyCompoundGluteTargetFix(
  foldExerciseName("barbell full squat"),
  "glutes",
  { glutes: 1, quads: 0.5 },
);
assert((squatGlute.quads ?? 0) >= 1, "squat glute target adds quads");
assert((squatGlute.glutes ?? 0) >= 1, "squat keeps glutes");

const calfMeta: ExerciseMuscleMeta = {
  exercise_id: "e1",
  name: "Икры",
  body_part: "lower legs",
  name_en: "barbell standing calf raise",
  name_ru: null,
  equipment: "barbell",
  source_exercise_id: "9999",
  target: "calves",
  secondary_muscles: ["hamstrings", "glutes"],
};
const calfWeights = resolveExerciseMuscleWeights(calfMeta);
assertEqual(calfWeights.calves, 1, "calf primary");
assert((calfWeights.hamstrings ?? 1) <= 0.25, "calf secondary hamstrings damped");

const squatStarter: ExerciseMuscleMeta = {
  exercise_id: "e2",
  name: "Присед",
  body_part: "upper legs",
  name_en: "barbell full squat",
  name_ru: "Приседания",
  equipment: "barbell",
  source_exercise_id: "0043",
  target: "glutes",
  secondary_muscles: ["quadriceps", "hamstrings"],
};
const squatWeights = resolveExerciseMuscleWeights(squatStarter);
assert((squatWeights.quads ?? 0) >= 1, "starter squat quads");
assert((squatWeights.glutes ?? 0) >= 1, "starter squat glutes");

const benchCatalog: ExerciseMuscleMeta = {
  exercise_id: "e3",
  name: "Жим",
  body_part: "chest",
  name_en: "barbell bench press",
  name_ru: null,
  equipment: "barbell",
  source_exercise_id: "9998",
  target: "pectorals",
  secondary_muscles: ["triceps", "shoulders"],
};
const benchWeights = resolveExerciseMuscleWeights(benchCatalog);
assert((benchWeights.chest ?? 0) >= 1, "bench chest");
assert((benchWeights.triceps ?? 0) >= 0.5, "bench triceps secondary");

assertEqual(
  mapCatalogSecondary("trapezius", foldExerciseName("row")),
  "traps",
  "trapezius synonym",
);
