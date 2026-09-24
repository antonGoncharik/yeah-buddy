import {
  clampMax,
  estimateAnchorMax,
  estimateExerciseMaxes,
  isTrainingAge,
  roundToStep,
  TRAINING_AGE_OPTIONS,
} from "@/lib/workout/estimate-maxes";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assert(TRAINING_AGE_OPTIONS.length === 3, "three age options");
assert(isTrainingAge("beginner"), "beginner");
assert(!isTrainingAge("pro"), "not an age");

assertEqual(roundToStep(101, 2.5), 100, "round down to 2.5");
assertEqual(roundToStep(101.3, 2.5), 102.5, "round up to 2.5");
assertEqual(clampMax(10), 20, "floor 20");
assertEqual(clampMax(400), 300, "ceil 300");

assertEqual(
  estimateAnchorMax({
    sex: "male",
    trainingAge: "beginner",
    weightKg: 80,
    lift: "squat",
    knownKg: null,
  }),
  65,
  "male beginner squat 0.8×80 → 64 → 65",
);

assertEqual(
  estimateAnchorMax({
    sex: "female",
    trainingAge: "beginner",
    weightKg: 80,
    lift: "squat",
    knownKg: null,
  }),
  47.5,
  "female beginner squat 0.6×80 → 48 → 47.5",
);

assertEqual(
  estimateAnchorMax({
    sex: "male",
    trainingAge: "beginner",
    weightKg: 80,
    lift: "squat",
    knownKg: 140,
  }),
  140,
  "known lift wins over the table",
);

assertEqual(
  estimateAnchorMax({
    sex: "female",
    trainingAge: "beginner",
    weightKg: 55,
    lift: "bench",
    knownKg: 15,
  }),
  15,
  "typed light bench is not floored to 20",
);

const filled = estimateExerciseMaxes({
  sex: "male",
  trainingAge: "year",
  weightKg: 80,
  known: { squat: 150, bench: null, deadlift: null },
  exercises: [
    {
      id: "s",
      name: "Приседания со штангой",
      weight_step: 2.5,
      workout_type: "dynamic",
      has_max: false,
    },
    {
      id: "r",
      name: "Румынская тяга",
      weight_step: 2.5,
      workout_type: "dynamic",
      has_max: false,
    },
    {
      id: "b",
      name: "Жим лёжа",
      weight_step: 2.5,
      workout_type: "dynamic",
      has_max: false,
    },
    {
      id: "skip",
      name: "Приседания со штангой",
      weight_step: 2.5,
      workout_type: "dynamic",
      has_max: true,
    },
    {
      id: "hold",
      name: "Планка",
      weight_step: 2.5,
      workout_type: "static",
      has_max: false,
    },
  ],
});

assertEqual(
  filled.find((item) => item.exerciseId === "s")?.maxWeight,
  150,
  "typed squat is the max",
);
assertEqual(
  filled.find((item) => item.exerciseId === "r")?.maxWeight,
  85,
  "RDL scales from estimated deadlift 1.5×80=120 → 0.7×120=84 → 85",
);
assertEqual(
  filled.find((item) => item.exerciseId === "b")?.maxWeight,
  72.5,
  "bench from table 0.9×80=72 → 72.5",
);
assert(
  filled.every((item) => item.exerciseId !== "skip"),
  "existing max skipped",
);
assert(
  filled.every((item) => item.exerciseId !== "hold"),
  "static skipped",
);

const fromKnownSquat = estimateExerciseMaxes({
  sex: "male",
  trainingAge: "beginner",
  weightKg: 80,
  known: { squat: 200, bench: null, deadlift: null },
  exercises: [
    {
      id: "leg",
      name: "Жим ногами",
      weight_step: 5,
      workout_type: "dynamic",
      has_max: false,
    },
  ],
});
assertEqual(
  fromKnownSquat[0]?.maxWeight,
  300,
  "leg press 1.5× typed squat 200 → 300 (clamped)",
);

const maleBench = estimateAnchorMax({
  sex: "male",
  trainingAge: "years",
  weightKg: 80,
  lift: "bench",
  knownKg: null,
});
const femaleBench = estimateAnchorMax({
  sex: "female",
  trainingAge: "years",
  weightKg: 80,
  lift: "bench",
  knownKg: null,
});
assert(maleBench > femaleBench, "male and female tables differ");

const catalog = estimateExerciseMaxes({
  sex: "male",
  trainingAge: "beginner",
  weightKg: 80,
  known: {},
  exercises: STARTER_EXERCISES.map((item) => ({
    id: item.name,
    name: item.name,
    weight_step: item.weight_step,
    workout_type: item.workout_type,
    has_max: false,
  })),
});
assertEqual(
  catalog.length,
  STARTER_EXERCISES.length,
  "every starter lift gets a max",
);
const lateral = catalog.find(
  (item) => item.name === "Разведение гантелей в стороны",
);
assert(
  lateral != null && lateral.maxWeight <= 10,
  "lateral raise is not floored at 20 kg",
);

console.log("estimate maxes ok");
