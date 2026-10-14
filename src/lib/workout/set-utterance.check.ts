import { parseSetUtterance } from "@/lib/workout/set-utterance";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  parseSetUtterance("82 с половиной на 6, запас 1"),
  { weight: 82.5, reps: 6, seconds: null, rir: 1 },
  "half kilo, reps, reserve",
);
assertEqual(
  parseSetUtterance("22,5 на 10"),
  { weight: 22.5, reps: 10, seconds: null, rir: null },
  "comma weight",
);
assertEqual(
  parseSetUtterance("30 секунд"),
  { weight: null, reps: null, seconds: 30, rir: null },
  "hold",
);
assertEqual(
  parseSetUtterance("12 повторов, запас 1"),
  { weight: null, reps: 12, seconds: null, rir: 1 },
  "bodyweight reps",
);
assertEqual(parseSetUtterance("привет"), null, "not a set");
