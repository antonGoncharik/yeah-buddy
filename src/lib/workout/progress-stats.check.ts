import {
  tonnageOverlayValues,
  withRelativePoints,
} from "@/lib/workout/progress-stats";
import {
  circleTonnageByRound,
  workTonnage,
} from "@/lib/workout/session-tonnage";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const points = withRelativePoints(
  [
    {
      date: "2026-09-03",
      weight: 175,
      seconds: null,
      tonnage: 2625,
      circle_tonnage: 2625,
      body_weight: null,
      relative: null,
      phase_type: null,
      macro_number: null,
      label: "3 сен",
    },
    {
      date: "2026-09-10",
      weight: 175,
      seconds: null,
      tonnage: 2625,
      circle_tonnage: 2625,
      body_weight: null,
      relative: null,
      phase_type: null,
      macro_number: null,
      label: "10 сен",
    },
  ],
  [
    { date: "2026-09-01", weight: 84 },
    { date: "2026-09-10", weight: 81 },
  ],
);

assertEqual(points[0]?.body_weight, 84, "carry to gym day");
assertEqual(points[0]?.relative, 2.08, "175 / 84");
assertEqual(points[1]?.body_weight, 81, "same-day weight");
assertEqual(points[1]?.relative, 2.16, "175 / 81");

assertEqual(
  workTonnage([
    {
      set_type: "work",
      actual_weight: 80,
      planned_weight: 80,
      actual_reps: 5,
      planned_reps: 5,
    },
    {
      set_type: "work",
      actual_weight: 80,
      planned_weight: 80,
      actual_reps: 5,
      planned_reps: 5,
    },
    {
      set_type: "warmup",
      actual_weight: 50,
      planned_weight: 50,
      actual_reps: 5,
      planned_reps: 5,
    },
  ]),
  800,
  "work kg×reps skips warmup",
);

assertEqual(
  workTonnage([
    {
      set_type: "work",
      actual_weight: 87,
      planned_weight: 87,
      actual_reps: null,
      planned_reps: null,
    },
  ]),
  null,
  "static without reps is not tonnage",
);

assertEqual(
  circleTonnageByRound(
    [
      { sessionIndex: 0, exerciseId: "squat", tonnage: 1200 },
      { sessionIndex: 1, exerciseId: "bench", tonnage: 800 },
      { sessionIndex: 2, exerciseId: "squat", tonnage: 1300 },
      { sessionIndex: 3, exerciseId: "bench", tonnage: 800 },
    ],
    2,
  ),
  [1200, 800, 1300, 800],
  "one appearance per round keeps day tonnage",
);

assertEqual(
  circleTonnageByRound(
    [
      { sessionIndex: 0, exerciseId: "squat", tonnage: 1000 },
      { sessionIndex: 1, exerciseId: "squat", tonnage: 1100 },
      { sessionIndex: 2, exerciseId: "squat", tonnage: 900 },
    ],
    2,
  ),
  [2100, 2100, 900],
  "same lift twice in a round sums",
);

assertEqual(
  tonnageOverlayValues(points),
  [2625, 2625],
  "overlay needs tonnage on every point",
);

console.log("progress relative ok");
