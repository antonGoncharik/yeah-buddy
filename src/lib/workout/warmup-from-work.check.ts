import {
  FIVE_BY_FIVE_FORMULAS,
  VOLUME_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
import { reps } from "@/lib/workout/formula-warmups";
import { plannedSetsFromFormula } from "@/lib/workout/formulas";
import { warmupSetsForWorkingWeight } from "@/lib/workout/warmup-from-work";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

function topWarmupBelowWork(
  max: number,
  formulas: typeof FIVE_BY_FIVE_FORMULAS,
  label: string,
) {
  const rows = plannedSetsFromFormula(
    formulas.dynamic.base,
    max,
    2.5,
    "dynamic",
    "barbell",
  );
  const work = rows.filter((row) => row.set_type === "work");
  const warmups = rows.filter((row) => row.set_type === "warmup");
  const topWork = Math.max(...work.map((row) => row.planned_weight));
  const topWarmup = warmups.length
    ? Math.max(...warmups.map((row) => row.planned_weight))
    : 0;
  assert(
    topWarmup < topWork,
    `${label}: warmup ${topWarmup} must be below work ${topWork}`,
  );
}

topWarmupBelowWork(100, VOLUME_WORKOUT_FORMULAS, "3x8@70");
topWarmupBelowWork(100, FIVE_BY_FIVE_FORMULAS, "3x5@80");

const light = plannedSetsFromFormula(
  VOLUME_WORKOUT_FORMULAS.dynamic.base,
  100,
  2.5,
  "dynamic",
  "barbell",
);
const warm = light.filter((row) => row.set_type === "warmup");
for (const row of warm) {
  assert(row.planned_weight >= 20, "warmup at least empty bar");
}

const heavyTop = plannedSetsFromFormula(
  { warmup: [], work: [{ percent: 88, reps: 3, seconds: null }] },
  240,
  2.5,
  "dynamic",
  "barbell",
).filter((row) => row.set_type === "warmup");
assert(
  heavyTop
    .map((row) => `${row.planned_weight}×${row.planned_reps}`)
    .join(", ") === "105×5, 145×3, 167.5×1, 187.5×1",
  "barbell warmup is 50/70/80/90 of the top set",
);

const custom = FIVE_BY_FIVE_FORMULAS.warmups;
const customWarmups = {
  ...custom,
  dynamic: {
    ...custom.dynamic,
    barbell: [reps(40, 8)],
  },
};
assert(
  warmupSetsForWorkingWeight(100, 2.5, "barbell", "dynamic", customWarmups)
    .length === 1,
  "warmup ladder comes from settings",
);
assert(
  warmupSetsForWorkingWeight(100, 2.5, "barbell", "dynamic", customWarmups)[0]
    ?.percent === 40,
  "settings percent is kept",
);

const staticLight = plannedSetsFromFormula(
  { warmup: [], work: [{ percent: 80, reps: null, seconds: 6 }] },
  100,
  1,
  "static",
  "barbell",
);
assert(
  staticLight.every(
    (row) => row.set_type !== "warmup" || (row.planned_weight ?? 0) < 80,
  ),
  "a hold warmup is not heavier than the work set",
);
const staticDefault = plannedSetsFromFormula(
  { warmup: [], work: [{ percent: 115, reps: null, seconds: 6 }] },
  100,
  1,
  "static",
  "barbell",
);
assert(
  staticDefault.some((row) => row.planned_seconds === 2),
  "default static warmup keeps the short hold under the work weight",
);
