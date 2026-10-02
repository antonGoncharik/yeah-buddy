import {
  heavierThanLine,
  liveSetRecord,
  liveWorkWeight,
} from "@/lib/workout/set-record";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  heavierThanLine("2026-03-12"),
  "тяжелее, чем 12 марта",
  "date of the old best",
);
assertEqual(heavierThanLine(null), "тяжелее, чем было", "no date");
assertEqual(
  liveSetRecord({ weight: 100, priorPeak: 90, priorOn: "2026-03-12" }),
  "тяжелее, чем 12 марта",
  "heavier than the old best",
);
assertEqual(
  liveSetRecord({ weight: 90, priorPeak: 90, priorOn: "2026-03-12" }),
  null,
  "the same bar is not a record",
);
assertEqual(
  liveSetRecord({ weight: 80, priorPeak: null, priorOn: null }),
  null,
  "the first time is not a record",
);

const sets = [
  {
    id: "warm",
    set_type: "warmup",
    actual_weight: null,
    planned_weight: 60,
  },
  {
    id: "work",
    set_type: "work",
    actual_weight: null,
    planned_weight: 80,
  },
];

assertEqual(liveWorkWeight(sets, {}), 80, "planned work, not the warmup");
assertEqual(
  liveWorkWeight(sets, { work: { weight: "100" } }),
  100,
  "an open draft replaces the plan",
);
assertEqual(
  liveWorkWeight(sets, { work: { weight: "" } }),
  80,
  "an empty draft falls back to the plan",
);

console.log("set record ok");
