import {
  macroGoalToleranceGrams,
  macroInGoal,
  MACRO_HIT_RATIO,
} from "@/lib/nutrition/macro-hit";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(MACRO_HIT_RATIO === 0.02, "ratio is two percent");

assert(macroInGoal(150, 150), "exact hit");
assert(macroInGoal(147, 150), "just inside low");
assert(macroInGoal(153, 150), "just inside high");
assert(!macroInGoal(146.9, 150), "just outside low");
assert(!macroInGoal(153.1, 150), "just outside high");
assert(!macroInGoal(100, 0), "no target");
assert(!macroInGoal(0, 120), "zero fact with target");

assert(
  Math.abs(macroGoalToleranceGrams(150) - 3) < 0.001,
  "tolerance scales with target",
);
