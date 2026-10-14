import { completedSetWeight } from "@/lib/workout/set-log";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  completedSetWeight({ plannedWeight: 80, typedWeight: null }),
  80,
  "a loaded set keeps the plan when nothing was typed",
);
assertEqual(
  completedSetWeight({ plannedWeight: 80, typedWeight: 82.5 }),
  82.5,
  "typed weight wins",
);
assertEqual(
  completedSetWeight({ plannedWeight: null, typedWeight: null }),
  null,
  "bodyweight can be logged without kilograms",
);
assertEqual(
  completedSetWeight({ plannedWeight: 0, typedWeight: null }),
  null,
  "a zero plan is bodyweight",
);
assertEqual(
  completedSetWeight({ plannedWeight: null, typedWeight: 10 }),
  10,
  "an added vest still counts",
);
