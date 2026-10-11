import { weeklyCohortKey } from "@/lib/analytics/cohorts";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

assertEqual(weeklyCohortKey("2026-10-11"), "2026-W41", "oct 11 cohort");

console.log("analytics cohorts ok");
