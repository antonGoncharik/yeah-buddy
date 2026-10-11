import {
  FIVE_BY_FIVE_FORMULAS,
  VOLUME_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
import { plannedSetsFromFormula } from "@/lib/workout/formulas";

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
