import type { FormulaSetSpec, WorkoutFormulas } from "@/lib/types";
import { DEFAULT_WARMUP_PRESETS } from "@/lib/workout/formula-warmups";
import { calcPlannedWeight } from "@/lib/workout/formulas";
import {
  decideTest,
  dropMaxFivePercent,
  dynamicTestMax,
  heaviestWorkIndexes,
  maxAfterTest,
  maxShownForPhase,
  plannedTestMax,
  staticTestMax,
  testSetId,
} from "@/lib/workout/test-raise";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function reps(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: count, seconds: null };
}

function seconds(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: null, seconds: count };
}

assertEqual(
  dynamicTestMax({
    maxKg: 240,
    stepKg: 2.5,
    weight: 210,
    reps: 5,
    requiredReps: 5,
  }),
  245,
  "squat 210×5 becomes 245",
);

assertEqual(
  dynamicTestMax({
    maxKg: 40,
    stepKg: 2.5,
    weight: 35,
    reps: 5,
    requiredReps: 5,
  }),
  42.5,
  "pull-up 35×5 becomes 42.5",
);

assertEqual(
  dynamicTestMax({
    maxKg: 240,
    stepKg: 2.5,
    weight: 210,
    reps: 4,
    requiredReps: 5,
  }),
  null,
  "short set does not raise",
);

assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 5 }),
  47,
  "a clean 5s hold confirms the max",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 6 }),
  48,
  "6s hold adds one step",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 7 }),
  48,
  "7s hold adds one step",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 8 }),
  49,
  "8s hold adds two steps",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 12 }),
  49,
  "past 8s still adds two steps",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 4 }),
  null,
  "short hold does not raise",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 5, weightKg: 54 }),
  54,
  "a 5s hold of a heavier load becomes the max",
);
assertEqual(
  staticTestMax({ maxKg: 47, stepKg: 1, seconds: 8, weightKg: 40 }),
  47,
  "a light long hold does not lower the max",
);
assertEqual(
  decideTest({
    maxKg: 47,
    stepKg: 1,
    previousFailed: false,
    attempts: [
      {
        kind: "static",
        weight: 47,
        reps: null,
        seconds: 5,
        requiredReps: null,
        requiredSeconds: 8,
      },
    ],
  }).note,
  "5 с, тот же",
  "five seconds is a confirmation",
);
assertEqual(
  testSetId([
    {
      id: "warm",
      set_type: "warmup",
      planned_weight: 20,
      planned_reps: null,
      planned_seconds: 2,
    },
    {
      id: "test",
      set_type: "work",
      planned_weight: 47,
      planned_reps: null,
      planned_seconds: 8,
    },
    {
      id: "back",
      set_type: "work",
      planned_weight: 42,
      planned_reps: null,
      planned_seconds: 5,
    },
  ]),
  "test",
  "the heavier hold is the test",
);

assertEqual(
  maxAfterTest({
    maxKg: 240,
    stepKg: 2.5,
    previousFailed: false,
    attempts: [
      {
        kind: "dynamic",
        weight: 210,
        reps: 5,
        seconds: null,
        requiredReps: 5,
        requiredSeconds: null,
      },
      {
        kind: "static",
        weight: 276,
        reps: null,
        seconds: 8,
        requiredReps: null,
        requiredSeconds: 8,
      },
    ],
  }),
  280,
  "shared max takes the higher result",
);

assertEqual(
  maxAfterTest({
    maxKg: 47,
    stepKg: 1,
    previousFailed: false,
    attempts: [
      {
        kind: "static",
        weight: 54,
        reps: null,
        seconds: 8,
        requiredReps: null,
        requiredSeconds: 8,
      },
    ],
  }),
  56,
  "static 8s test is the load held plus two steps",
);

assertEqual(
  maxAfterTest({
    maxKg: 240,
    stepKg: 2.5,
    previousFailed: false,
    attempts: [
      {
        kind: "dynamic",
        weight: 210,
        reps: 3,
        seconds: null,
        requiredReps: 5,
        requiredSeconds: null,
      },
    ],
  }),
  240,
  "one missed test keeps the max",
);

assertEqual(
  maxAfterTest({
    maxKg: 240,
    stepKg: 2.5,
    previousFailed: true,
    attempts: [],
  }),
  dropMaxFivePercent(240, 2.5),
  "two missed macros drop 5%",
);
assertEqual(dropMaxFivePercent(240, 2.5), 227.5, "240 minus 5% is 227.5");

const volume = [reps(88, 5), reps(80, 5), reps(80, 5)];
const peak = [reps(90, 2), reps(85, 3), reps(80, 5)];
const staticVolume = [seconds(115, 8), seconds(115, 6), seconds(115, 6)];

assertEqual(
  plannedTestMax({ maxKg: 240, stepKg: 2.5, kind: "dynamic", work: volume }),
  245,
  "planned squat test is 245",
);
assertEqual(
  plannedTestMax({
    maxKg: 240,
    stepKg: 2.5,
    kind: "dynamic",
    work: [reps(75, 5), reps(85, 3), reps(95, 1)],
  }),
  242.5,
  "the last single is the test, not the opening five",
);
assertEqual(
  plannedTestMax({
    maxKg: 240,
    stepKg: 2.5,
    kind: "dynamic",
    work: [reps(80, 5), reps(90, 3), reps(100, 1)],
  }),
  247.5,
  "a made max single uses that last set",
);
assertEqual(
  heaviestWorkIndexes("dynamic", [
    { load: 180, reps: 5, seconds: null },
    { load: 210, reps: 5, seconds: null },
    { load: 190, reps: 5, seconds: null },
  ]),
  [1],
  "middle set is the test when it is the heaviest",
);
assertEqual(
  plannedTestMax({ maxKg: 47, stepKg: 1, kind: "static", work: staticVolume }),
  56,
  "planned 8s hold is that load plus two steps",
);
assertEqual(
  plannedTestMax({
    maxKg: 47,
    stepKg: 1,
    kind: "static",
    work: [seconds(115, 6), seconds(115, 6), seconds(115, 8)],
  }),
  56,
  "the last 8s hold is the test",
);
assertEqual(
  plannedTestMax({
    maxKg: 47,
    stepKg: 1,
    kind: "static",
    work: [seconds(90, 5), seconds(90, 5)],
  }),
  47,
  "a made 5s hold confirms and does not raise",
);
assertEqual(
  plannedTestMax({
    maxKg: 47,
    stepKg: 1,
    kind: "static",
    work: [seconds(80, 3), seconds(80, 3)],
  }),
  null,
  "a 3s plan has no test",
);

assertEqual(calcPlannedWeight(240, 85, 2.5), 202.5, "squat ramp top");
assertEqual(calcPlannedWeight(240, 80, 2.5), 190, "squat 80%");
assertEqual(calcPlannedWeight(240, 88, 2.5), 210, "squat test weight");
assertEqual(calcPlannedWeight(245, 90, 2.5), 220, "squat peak top");
assertEqual(calcPlannedWeight(245, 85, 2.5), 207.5, "squat peak middle");
assertEqual(calcPlannedWeight(245, 80, 2.5), 195, "squat peak back-off");
assertEqual(
  calcPlannedWeight(240, 70, 2.5),
  167.5,
  "squat deload on the old max",
);
assertEqual(calcPlannedWeight(42.5, 90, 2.5), 37.5, "pull-up peak top");
assertEqual(calcPlannedWeight(42.5, 85, 2.5), 35, "pull-up peak middle");
assertEqual(calcPlannedWeight(42.5, 80, 2.5), 32.5, "pull-up peak back-off");
assertEqual(calcPlannedWeight(47, 115, 1), 54, "pronation ramp");
assertEqual(calcPlannedWeight(48, 115, 1), 55, "pronation peak after the test");
assertEqual(calcPlannedWeight(47, 100, 1), 47, "pronation deload");

const formulas: WorkoutFormulas = {
  dynamic: {
    base: { warmup: [], work: [reps(80, 5)] },
    phases: {
      volume: { warmup: [], work: volume },
      peak: { warmup: [], work: peak },
    },
  },
  static: {
    base: { warmup: [], work: [seconds(115, 6)] },
    phases: {
      volume: { warmup: [], work: staticVolume },
    },
  },
  warmups: DEFAULT_WARMUP_PRESETS,
  cycle: [
    {
      key: "ramp",
      name: "Разгон",
      skip_warmup: false,
      increase_on_end: false,
    },
    {
      key: "volume",
      name: "Набор",
      skip_warmup: false,
      increase_on_end: true,
      raise_from_test: true,
    },
    {
      key: "peak",
      name: "Рывок",
      skip_warmup: false,
      increase_on_end: false,
    },
    {
      key: "deload",
      name: "Сброс",
      skip_warmup: false,
      increase_on_end: false,
    },
  ],
};

assertEqual(
  maxShownForPhase({
    formulas,
    kind: "dynamic",
    phaseKey: "ramp",
    maxKg: 240,
    stepKg: 2.5,
  }),
  240,
  "ramp still uses the current max",
);
assertEqual(
  maxShownForPhase({
    formulas,
    kind: "dynamic",
    phaseKey: "peak",
    maxKg: 240,
    stepKg: 2.5,
  }),
  245,
  "peak example uses the test, not +5%",
);
assertEqual(
  maxShownForPhase({
    formulas,
    kind: "static",
    phaseKey: "peak",
    maxKg: 47,
    stepKg: 1,
  }),
  56,
  "static peak example uses the held load plus two steps",
);

console.log("test raise ok");
