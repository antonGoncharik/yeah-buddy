import { parseDiaryDensity } from "@/lib/diary-density";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(parseDiaryDensity(undefined), "expanded", "missing stays expanded");
assertEqual(parseDiaryDensity("expanded"), "expanded", "expanded");
assertEqual(parseDiaryDensity("compact"), "compact", "compact");
assertEqual(parseDiaryDensity("wide"), "expanded", "unknown stays expanded");
