import {
  setsPerWeek,
  volumeBandFromWeeklySets,
  weekIndexFromSince,
} from "@/lib/workout/muscle-volume";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

assertEqual(setsPerWeek(10, 14), 5, "14d horizon → 2 weeks");
assertEqual(setsPerWeek(10, 30, 7), 10, "new lifter uses 7-day divisor");
assertEqual(volumeBandFromWeeklySets(0.2), 0, "low weekly → band 0");
assertEqual(volumeBandFromWeeklySets(5), 2, "mid weekly → band 2 (legacy)");
assertEqual(volumeBandFromWeeklySets(25), 4, "high weekly → band 4 (legacy)");
assertEqual(
  volumeBandFromWeeklySets(9, "chest"),
  2,
  "chest between MEV and MAV",
);
assertEqual(volumeBandFromWeeklySets(20, "biceps"), 4, "biceps above MRV");
assertEqual(weekIndexFromSince("2026-10-01", "2026-10-08"), 1, "week index");
