import { e1rmFromWorkSet } from "@/lib/workout/e1rm";
import { floorToStep } from "@/lib/workout/formulas";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const work = {
  set_type: "work",
  planned_weight: 80,
  actual_weight: 85,
  planned_reps: 5,
  actual_reps: 5,
  planned_rir: null,
  actual_rir: null,
};

const e1 = e1rmFromWorkSet(work);
assert(e1 != null && e1 > 80, "e1rm from work set");
if (e1 == null) {
  throw new Error("e1rm missing");
}
assert(floorToStep(e1, 2.5) > 80, "floored e1rm above working weight");

console.log("estimate max refresh ok");
