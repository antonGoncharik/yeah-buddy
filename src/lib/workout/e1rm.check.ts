import { e1rmFromWorkSet, estimateE1rm } from "@/lib/workout/e1rm";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const e85x2 = estimateE1rm(85, 2);
assert(e85x2 != null && e85x2 < 93, "85x2 below 80x5 e1rm");

const e80x5 = estimateE1rm(80, 5);
const e80x10 = estimateE1rm(80, 10);
assert(
  e80x10 != null && e80x5 != null && e80x10 > e80x5,
  "more reps higher e1rm",
);

assert(estimateE1rm(100, 1) === 100, "single is weight");

const asPlanned = e1rmFromWorkSet({
  set_type: "work",
  planned_weight: 100,
  actual_weight: 100,
  planned_reps: 5,
  actual_reps: 5,
  planned_rir: 2,
  actual_rir: null,
});
assert(asPlanned === estimateE1rm(100, 5, 2), "planned reserve counts as done");

const repsChanged = e1rmFromWorkSet({
  set_type: "work",
  planned_weight: 100,
  actual_weight: 100,
  planned_reps: 5,
  actual_reps: 3,
  planned_rir: 2,
  actual_rir: null,
});
assert(
  repsChanged === estimateE1rm(100, 3, 0),
  "changed reps drop the planned reserve",
);
