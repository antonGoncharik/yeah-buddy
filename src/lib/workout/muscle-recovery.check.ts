import { muscleRecoveryPercent } from "@/lib/workout/muscle-recovery";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  muscleRecoveryPercent({
    muscleId: "quads",
    days_since: 1,
    sets_per_week: 8,
    sets: 8,
  }),
  40,
  "quads are still sore the next day",
);
assertEqual(
  muscleRecoveryPercent({
    muscleId: "biceps",
    days_since: 1,
    sets_per_week: 4,
    sets: 4,
  }),
  62,
  "biceps recover faster than quads",
);
assertEqual(
  muscleRecoveryPercent({
    muscleId: "biceps",
    days_since: 4,
    sets_per_week: 4,
    sets: 4,
  }),
  100,
  "a small muscle is ready by day 4",
);
assertEqual(
  muscleRecoveryPercent({
    muscleId: "quads",
    days_since: 1,
    sets_per_week: 24,
    sets: 24,
  }),
  33,
  "volume past MRV drags large-muscle recovery",
);
assertEqual(
  muscleRecoveryPercent({
    muscleId: "chest",
    days_since: null,
    sets_per_week: 0,
    sets: 0,
  }),
  null,
  "untrained muscle has no recovery percent",
);

console.log("muscle recovery ok");
