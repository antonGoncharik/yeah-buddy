import {
  bodyWeightOnOrBefore,
  bodyWeightWindow,
  carriedBodyWeight,
  formatProteinPerKg,
  formatRelative,
  parseBodyWeight,
  proteinPerKg,
  relativeStrength,
  weightDelta,
} from "@/lib/day/body-weight";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(parseBodyWeight(82.44), 82.4, "round down .44");
assertEqual(parseBodyWeight(82.45), 82.5, "round .45");
assertEqual(parseBodyWeight(19.9), null, "below min");
assertEqual(parseBodyWeight(400.1), null, "above max");
assertEqual(parseBodyWeight(null), null, "null");

const weights = [
  { date: "2026-09-01", weight: 84 },
  { date: "2026-09-04", weight: 82.5 },
  { date: "2026-09-10", weight: 81 },
];

assertEqual(bodyWeightOnOrBefore(weights, "2026-08-31"), null, "before first");
assertEqual(bodyWeightOnOrBefore(weights, "2026-09-01"), 84, "on first");
assertEqual(bodyWeightOnOrBefore(weights, "2026-09-03"), 84, "gap carry");
assertEqual(bodyWeightOnOrBefore(weights, "2026-09-04"), 82.5, "on second");
assertEqual(bodyWeightOnOrBefore(weights, "2026-09-12"), 81, "after last");

const carried = carriedBodyWeight([
  { date: "2026-09-10", body_weight: 81 },
  { date: "2026-09-01", body_weight: 84 },
  { date: "2026-09-02", body_weight: null },
]);
assertEqual(carried.get("2026-09-01"), 84, "logged day");
assertEqual(carried.get("2026-09-02"), 84, "next day carries");
assertEqual(carried.get("2026-09-10"), 81, "later log");

const seeded = carriedBodyWeight(
  [{ date: "2026-09-02", body_weight: null }],
  84,
);
assertEqual(seeded.get("2026-09-02"), 84, "seed carries");

assertEqual(relativeStrength(175, 82.5), 2.12, "bar / body");
assertEqual(relativeStrength(0, 82), null, "no bar");
assertEqual(proteinPerKg(148.5, 82.5), 1.8, "protein / kg");
assertEqual(proteinPerKg(120, 0), null, "no body");

assertEqual(formatProteinPerKg(1.8), "1,8 г/кг", "protein format");
assertEqual(formatRelative(2.12), "2,12×", "relative format");
assertEqual(formatRelative(2), "2×", "relative integer");
assertEqual(weightDelta(84, 81.2), -2.8, "lost weight");
assertEqual(weightDelta(80, 80), 0, "flat");
assertEqual(weightDelta(null, 80), null, "missing start");

const window = bodyWeightWindow([
  {
    date: "2026-09-01",
    body_weight: 84,
    fact_protein: 168,
    target_protein: 168,
  },
  {
    date: "2026-09-02",
    body_weight: null,
    fact_protein: 168,
    target_protein: 168,
  },
  {
    date: "2026-09-10",
    body_weight: 81,
    fact_protein: 162,
    target_protein: 162,
  },
]);
assertEqual(window?.logged, 2, "logged count");
assertEqual(window?.start, 84, "start");
assertEqual(window?.end, 81, "end");
assertEqual(window?.delta, -3, "delta");
assertEqual(window?.protein_per_kg, 2, "avg g/kg");

console.log("body weight ok");
