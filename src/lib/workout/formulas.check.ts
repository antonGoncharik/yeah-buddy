import { nextPhaseType, withCycle } from "@/lib/workout/cycle";
import {
  DEFAULT_WORKOUT_FORMULAS,
  FOUR_PHASE_CYCLE,
} from "@/lib/workout/default-formulas";
import {
  calcPlannedWeight,
  floorToStep,
  increaseMax,
  plannedSetsFromFormula,
  previewMaxForPhase,
  resolvePhaseSpec,
} from "@/lib/workout/formulas";
import {
  fillFormulas,
  formulasSchema,
  mapWorkoutSettings,
} from "@/lib/workout/map-settings";

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: got ${actual}, expected ${expected}`);
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

assertEqual(floorToStep(183.75, 2.5), 182.5, "210×87.5 шаг 2.5");
assertEqual(floorToStep(132, 2.5), 130, "220×60 шаг 2.5");
assertEqual(floorToStep(87.4, 1), 87, "76×115 шаг 1");
assertEqual(calcPlannedWeight(210, 87.5, 2.5), 182.5, "calc 210 87.5");
assertEqual(calcPlannedWeight(220, 60, 2.5), 130, "calc 220 60");
assertEqual(calcPlannedWeight(76, 115, 1), 87, "calc 76 115");
assertEqual(calcPlannedWeight(80, 115, 1), 92, "calc 80 115");
assertEqual(increaseMax(220, 5, 2.5), 230, "220 +5% шаг 2.5");
assertEqual(increaseMax(70, 5, 1), 73, "70 +5% шаг 1");
assertEqual(
  previewMaxForPhase([], "ramp", 220, 5, 2.5),
  220,
  "пример без цикла",
);
assertEqual(
  previewMaxForPhase(FOUR_PHASE_CYCLE, "ramp", 220, 5, 2.5),
  220,
  "пример разгона",
);
assertEqual(
  previewMaxForPhase(FOUR_PHASE_CYCLE, "volume", 220, 5, 2.5),
  220,
  "пример набора",
);
assertEqual(
  previewMaxForPhase(FOUR_PHASE_CYCLE, "peak", 220, 5, 2.5),
  230,
  "пример рывка",
);
assertEqual(
  previewMaxForPhase(FOUR_PHASE_CYCLE, "deload", 220, 5, 2.5),
  230,
  "пример сброса",
);
assertEqual(calcPlannedWeight(220, 50, 2.5), 110, "220×50 разминка");
assertEqual(calcPlannedWeight(220, 70, 2.5), 152.5, "220×70 разминка");
assertEqual(calcPlannedWeight(220, 80, 2.5), 175, "220×80 разминка");
assertEqual(calcPlannedWeight(220, 88, 2.5), 192.5, "220×88 рабочий");
assertEqual(calcPlannedWeight(220, 82, 2.5), 180, "220×82 рабочий");
assertEqual(calcPlannedWeight(220, 76, 2.5), 165, "220×76 рабочий");

if (
  DEFAULT_WORKOUT_FORMULAS.dynamic.base.work.length !== 3 ||
  DEFAULT_WORKOUT_FORMULAS.dynamic.base.work[0]?.percent !== 80 ||
  DEFAULT_WORKOUT_FORMULAS.dynamic.base.work[0]?.reps !== 5 ||
  DEFAULT_WORKOUT_FORMULAS.cycle.length !== 0
) {
  throw new Error("default scheme should be 3×5 at 80% without a cycle");
}

const cableRamp = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.dynamic.base,
  "dynamic",
  false,
  "cable",
);
if (cableRamp.warmup.length !== 2) {
  throw new Error("cable warmup should be 2 sets");
}

const four = withCycle(DEFAULT_WORKOUT_FORMULAS, FOUR_PHASE_CYCLE);
const deload = resolvePhaseSpec(
  four.dynamic.phases.deload ?? four.dynamic.base,
  "dynamic",
  true,
  "barbell",
);
if (deload.warmup.length !== 0 || deload.work.length !== 3) {
  throw new Error("dynamic deload should be 3 work sets, no warmup");
}

const staticBarbell = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.static.base,
  "static",
  false,
  "barbell",
);
if (staticBarbell.warmup.length !== 3) {
  throw new Error("static barbell warmup should be 3 sets");
}
if (
  staticBarbell.warmup[0]?.reps == null ||
  staticBarbell.warmup[1]?.reps == null
) {
  throw new Error("static warmup first sets must be reps");
}
if (
  staticBarbell.warmup[2]?.seconds !== 2 ||
  staticBarbell.warmup[2]?.percent !== 100 ||
  staticBarbell.warmup[2]?.reps != null
) {
  throw new Error("static warmup 3rd set must be 2s at 100%");
}

const staticHold = plannedSetsFromFormula(staticBarbell, 76, 1, "static");
assertEqual(staticHold[0]?.planned_reps ?? 0, 5, "static warmup reps");
assertEqual(
  staticHold[0]?.planned_seconds ?? -1,
  -1,
  "static warmup no seconds",
);
assertEqual(staticHold[2]?.planned_weight ?? 0, 76, "static 1RM hold weight");
assertEqual(staticHold[2]?.planned_seconds ?? 0, 2, "static 1RM hold seconds");
assertEqual(staticHold[3]?.planned_weight ?? 0, 87, "static work 76×115");
assertEqual(staticHold[3]?.planned_seconds ?? 0, 6, "static work seconds");
assertEqual(staticHold[3]?.planned_reps ?? -1, -1, "static work no reps");

const staticDeload = resolvePhaseSpec(
  four.static.phases.deload ?? four.static.base,
  "static",
  true,
  "barbell",
);
if (staticDeload.warmup.length !== 0) {
  throw new Error("static deload should have no warmup");
}

const customWarmup = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.dynamic.base,
  "dynamic",
  false,
  "barbell",
  {
    dynamic: {
      barbell: [{ percent: 40, reps: 10, seconds: null }],
      cable: DEFAULT_WORKOUT_FORMULAS.warmups.dynamic.cable,
    },
    static: DEFAULT_WORKOUT_FORMULAS.warmups.static,
  },
);
if (
  customWarmup.warmup.length !== 1 ||
  customWarmup.warmup[0]?.percent !== 40
) {
  throw new Error("custom warmup preset should replace barbell warmup");
}

const parsed = formulasSchema.safeParse({
  dynamic: DEFAULT_WORKOUT_FORMULAS.dynamic,
  static: DEFAULT_WORKOUT_FORMULAS.static,
  warmups: DEFAULT_WORKOUT_FORMULAS.warmups.dynamic,
  cycle: [],
});
if (!parsed.success) {
  throw new Error("legacy warmups should parse");
}
const migrated = fillFormulas(parsed.data);
if (migrated.warmups.static.barbell[2]?.seconds !== 2) {
  throw new Error("legacy warmups should get static 1RM hold");
}

function phase(work: Array<{ percent: number; reps: number | null }>) {
  return {
    warmup: [],
    work: work.map((set) => ({
      percent: set.percent,
      reps: set.reps,
      seconds: null,
    })),
  };
}

const classicKind = {
  ramp: phase([
    { percent: 88, reps: 3 },
    { percent: 82, reps: 5 },
    { percent: 76, reps: 7 },
  ]),
  volume: phase([
    { percent: 88, reps: 5 },
    { percent: 82, reps: 5 },
    { percent: 76, reps: 7 },
  ]),
  peak: phase([
    { percent: 88, reps: 3 },
    { percent: 82, reps: 5 },
    { percent: 76, reps: 7 },
  ]),
  deload: phase([
    { percent: 60, reps: 5 },
    { percent: 60, reps: 5 },
    { percent: 60, reps: 5 },
  ]),
};

const classic = mapWorkoutSettings({
  user_id: "u",
  max_increase_percent: 5,
  formulas: {
    dynamic: classicKind,
    static: {
      ramp: DEFAULT_WORKOUT_FORMULAS.static.base,
      volume: DEFAULT_WORKOUT_FORMULAS.static.base,
      peak: DEFAULT_WORKOUT_FORMULAS.static.base,
      deload: four.static.phases.deload,
    },
    warmups: DEFAULT_WORKOUT_FORMULAS.warmups,
  },
  updated_at: "2026-09-01",
});

assert(classic.formulas.cycle.length === 4, "classic cycle kept");
assert(classic.formulas.cycle[0]?.key === "ramp", "classic starts with ramp");
assert(
  classic.formulas.dynamic.phases.volume?.work[0]?.reps === 5,
  "classic volume work kept",
);
assert(
  nextPhaseType("volume", classic.formulas.cycle) === "peak",
  "classic volume → peak",
);
assert(
  nextPhaseType("deload", classic.formulas.cycle) == null,
  "classic deload ends the macro",
);

const simpleLegacy = mapWorkoutSettings({
  user_id: "u",
  max_increase_percent: 5,
  formulas: {
    dynamic: {
      ramp: DEFAULT_WORKOUT_FORMULAS.dynamic.base,
      volume: DEFAULT_WORKOUT_FORMULAS.dynamic.base,
      peak: DEFAULT_WORKOUT_FORMULAS.dynamic.base,
      deload: four.dynamic.phases.deload,
    },
    static: {
      ramp: DEFAULT_WORKOUT_FORMULAS.static.base,
      volume: DEFAULT_WORKOUT_FORMULAS.static.base,
      peak: DEFAULT_WORKOUT_FORMULAS.static.base,
      deload: four.static.phases.deload,
    },
    warmups: DEFAULT_WORKOUT_FORMULAS.warmups,
  },
  updated_at: "2026-09-01",
});
assert(simpleLegacy.formulas.cycle.length === 0, "matching work drops cycle");
assert(
  simpleLegacy.formulas.dynamic.base.work[0]?.percent === 80,
  "simple legacy keeps 3×5 base",
);

console.log("workout formulas ok");
