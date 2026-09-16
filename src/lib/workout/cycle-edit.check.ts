import type { CyclePhaseDef } from "@/lib/types";
import {
  applyWorkPattern,
  patchCyclePhase,
  patchKindBaseWork,
  phaseHasCustomWork,
  reorderCycle,
  resetPhaseWork,
  withCycle,
} from "@/lib/workout/cycle-edit";
import { workSetsEqual } from "@/lib/workout/cycle-query";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
  FIVE_BY_FIVE_FORMULAS,
  FOUR_PHASE_CYCLE,
} from "@/lib/workout/default-formulas";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

function phaseAt(cycle: CyclePhaseDef[], index: number): CyclePhaseDef {
  const phase = cycle[index];
  if (!phase) {
    throw new Error(`missing phase ${index}`);
  }
  return phase;
}

const four = withCycle(DEFAULT_WORKOUT_FORMULAS, FOUR_PHASE_CYCLE);

assert(
  !phaseHasCustomWork(four, "dynamic", phaseAt(four.cycle, 0)),
  "ramp inherits base",
);
assert(
  !phaseHasCustomWork(four, "dynamic", phaseAt(four.cycle, 3)),
  "deload inherits light work",
);

const customVolume = cloneFormulas(four);
customVolume.dynamic.phases.volume = {
  warmup: [],
  work: [
    { percent: 88, reps: 5, seconds: null },
    { percent: 82, reps: 5, seconds: null },
    { percent: 76, reps: 7, seconds: null },
  ],
};
assert(
  phaseHasCustomWork(customVolume, "dynamic", phaseAt(customVolume.cycle, 1)),
  "volume with own reps is custom",
);

const raisedBase = patchKindBaseWork(
  customVolume,
  "dynamic",
  Array.from({ length: 5 }, () => ({ percent: 80, reps: 5, seconds: null })),
);
assert(raisedBase.dynamic.base.work.length === 5, "base work becomes 5×5");
assert(
  raisedBase.dynamic.phases.ramp?.work.length === 5,
  "inherited ramp follows base",
);
assert(
  raisedBase.dynamic.phases.volume?.work[0]?.reps === 5 &&
    raisedBase.dynamic.phases.volume?.work[2]?.reps === 7,
  "custom volume stays",
);
assert(
  workSetsEqual(
    raisedBase.dynamic.phases.deload?.work ?? [],
    four.dynamic.phases.deload?.work ?? [],
  ),
  "deload stays the light pattern",
);

const skipped = patchCyclePhase(four, "ramp", { skip_warmup: true });
assert(
  skipped.dynamic.phases.ramp?.work[0]?.percent === 60,
  "inherited ramp becomes light when warmup skipped",
);

const restored = resetPhaseWork(customVolume, "dynamic", "volume");
assert(
  !phaseHasCustomWork(restored, "dynamic", phaseAt(restored.cycle, 1)),
  "reset volume back to base",
);

const fiveByFive = applyWorkPattern(customVolume, FIVE_BY_FIVE_FORMULAS);
assert(fiveByFive.dynamic.base.work.length === 5, "preset updates base");
assert(
  fiveByFive.dynamic.phases.ramp?.work.length === 5,
  "preset updates inherited ramp",
);
assert(
  fiveByFive.dynamic.phases.volume?.work[2]?.reps === 7,
  "preset keeps custom volume",
);

const reordered = reorderCycle(four, ["deload", "ramp", "volume", "peak"]);
assert(reordered.cycle[0]?.key === "deload", "drag can put deload first");
assert(reordered.cycle[1]?.key === "ramp", "ramp follows");
assert(
  reordered.dynamic.phases.volume?.work[0]?.percent ===
    four.dynamic.phases.volume?.work[0]?.percent,
  "reorder keeps phase work",
);
assert(
  reorderCycle(four, ["ramp", "volume"]).cycle[0]?.key === "ramp",
  "short key list is ignored",
);

const cleared = withCycle(four, []);
assert(cleared.cycle.length === 0, "an empty cycle wipes leftover weeks");
assert(cleared.cycle_loop == null, "clearing weeks drops the loop");
assert(cleared.cycle_auto_end == null, "clearing weeks drops auto-end");

console.log("cycle edit ok");
