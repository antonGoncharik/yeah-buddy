import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  calcPlannedWeight,
  floorToStep,
  increaseMax,
  plannedSetsFromFormula,
  previewMaxForPhase,
  resolvePhaseSpec,
} from "@/lib/workout/formulas";

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: got ${actual}, expected ${expected}`);
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
assertEqual(previewMaxForPhase("ramp", 220, 5, 2.5), 220, "пример разгона");
assertEqual(previewMaxForPhase("volume", 220, 5, 2.5), 220, "пример набора");
assertEqual(previewMaxForPhase("peak", 220, 5, 2.5), 230, "пример рывка");
assertEqual(previewMaxForPhase("deload", 220, 5, 2.5), 230, "пример сброса");
assertEqual(calcPlannedWeight(220, 50, 2.5), 110, "220×50 разминка");
assertEqual(calcPlannedWeight(220, 70, 2.5), 152.5, "220×70 разминка");
assertEqual(calcPlannedWeight(220, 80, 2.5), 175, "220×80 разминка");
assertEqual(calcPlannedWeight(220, 88, 2.5), 192.5, "220×88 рабочий");
assertEqual(calcPlannedWeight(220, 82, 2.5), 180, "220×82 рабочий");
assertEqual(calcPlannedWeight(220, 76, 2.5), 165, "220×76 рабочий");

const cableRamp = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.dynamic.ramp,
  "dynamic",
  "ramp",
  "cable",
);
if (cableRamp.warmup.length !== 2) {
  throw new Error("cable warmup should be 2 sets");
}

const deload = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.dynamic.deload,
  "dynamic",
  "deload",
  "barbell",
);
if (deload.warmup.length !== 0 || deload.work.length !== 3) {
  throw new Error("dynamic deload should be 3 work sets, no warmup");
}

const staticBarbell = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.static.ramp,
  "static",
  "ramp",
  "barbell",
);
if (staticBarbell.warmup.length !== 3) {
  throw new Error("static barbell warmup should be 3 rep sets");
}
if (
  staticBarbell.warmup.some((set) => set.reps == null || set.seconds != null)
) {
  throw new Error("static warmup must be reps, not seconds");
}

const staticHold = plannedSetsFromFormula(staticBarbell, 76, 1, "static");
assertEqual(staticHold[0]?.planned_reps ?? 0, 5, "static warmup reps");
assertEqual(
  staticHold[0]?.planned_seconds ?? -1,
  -1,
  "static warmup no seconds",
);
assertEqual(staticHold[3]?.planned_weight ?? 0, 87, "static work 76×115");
assertEqual(staticHold[3]?.planned_seconds ?? 0, 6, "static work seconds");
assertEqual(staticHold[3]?.planned_reps ?? -1, -1, "static work no reps");

const staticDeload = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.static.deload,
  "static",
  "deload",
  "barbell",
);
if (staticDeload.warmup.length !== 0) {
  throw new Error("static deload should have no warmup");
}

const customWarmup = resolvePhaseSpec(
  DEFAULT_WORKOUT_FORMULAS.dynamic.ramp,
  "dynamic",
  "ramp",
  "barbell",
  {
    barbell: [{ percent: 40, reps: 10, seconds: null }],
    cable: DEFAULT_WORKOUT_FORMULAS.warmups.cable,
  },
);
if (
  customWarmup.warmup.length !== 1 ||
  customWarmup.warmup[0]?.percent !== 40
) {
  throw new Error("custom warmup preset should replace barbell warmup");
}

console.log("workout formulas ok");
