import { estimateE1rm } from "@/lib/workout/e1rm";

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
