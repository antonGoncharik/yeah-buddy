import {
  primaryMuscle,
  rankSwapOptions,
  swapMode,
  swapPlanLine,
} from "@/lib/workout/session-swap";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  primaryMuscle({ chest: 1, triceps: 0.35 }),
  "chest",
  "bench is chest",
);
assertEqual(primaryMuscle({ biceps: 0.1 }), null, "too weak to call a target");

const ranked = rankSwapOptions({
  currentId: "bench",
  currentType: "dynamic",
  takenIds: ["row"],
  options: [
    { id: "bench", name: "Жим лёжа", workoutType: "dynamic" },
    { id: "row", name: "Тяга", workoutType: "dynamic" },
    { id: "db", name: "Жим гантелей", workoutType: "dynamic" },
    { id: "hold", name: "Планка", workoutType: "static" },
    { id: "machine", name: "Хаммер", workoutType: "dynamic" },
  ],
});
assertEqual(
  ranked.map((item) => item.id),
  ["db", "machine", "hold"],
  "same kind first, taken and current gone",
);

const staticFirst = rankSwapOptions({
  currentId: "hold",
  currentType: "static",
  takenIds: [],
  options: [
    { id: "db", name: "Жим гантелей", workoutType: "dynamic" },
    { id: "plank", name: "Планка", workoutType: "static" },
  ],
  limit: 5,
});
assertEqual(
  staticFirst.map((item) => item.name),
  ["Планка", "Жим гантелей"],
  "matching kind stays ahead",
);

assertEqual(
  swapPlanLine([
    {
      set_type: "work",
      set_number: 1,
      planned_weight: 24,
      planned_reps: 8,
      planned_reps_to: null,
      planned_seconds: null,
      planned_rir: 2,
    },
    {
      set_type: "work",
      set_number: 2,
      planned_weight: 24,
      planned_reps: 8,
      planned_reps_to: null,
      planned_seconds: null,
      planned_rir: 2,
    },
    {
      set_type: "work",
      set_number: 3,
      planned_weight: 24,
      planned_reps: 8,
      planned_reps_to: null,
      planned_seconds: null,
      planned_rir: 2,
    },
  ]),
  "3×8 · 24 кг",
  "three working sets",
);

assertEqual(
  swapPlanLine([
    {
      set_type: "work",
      set_number: 1,
      planned_weight: null,
      planned_reps: null,
      planned_reps_to: null,
      planned_seconds: 30,
      planned_rir: null,
    },
  ]),
  "1×30 с",
  "hold",
);

assertEqual(
  swapMode([
    { is_completed: false, set_type: "warmup" },
    { is_completed: false, set_type: "work" },
  ]),
  "replace",
  "nothing logged yet replaces the whole exercise",
);
assertEqual(
  swapMode([
    { is_completed: true, set_type: "warmup" },
    { is_completed: false, set_type: "work" },
    { is_completed: false, set_type: "work" },
  ]),
  "continue",
  "a logged warmup keeps the exercise and swaps the rest",
);
assertEqual(
  swapMode([{ is_completed: true, set_type: "work" }]),
  "blocked",
  "every work set logged leaves nothing to swap",
);
