import { readRulerValue } from "@/components/onboarding/tick-ruler";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(readRulerValue(0, 14, 30, 250), 30, "ruler at rest");
assertEqual(readRulerValue(14, 14, 30, 250), 31, "one tick");
assertEqual(readRulerValue(21, 14, 120, 230), 122, "rounds to nearest tick");
assertEqual(readRulerValue(9999, 14, 120, 122), 122, "clamps to last tick");
assertEqual(readRulerValue(10, 0, 30, 250), 30, "zero width stays at min");
