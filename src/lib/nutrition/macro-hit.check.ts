import {
  MACRO_HIT_RATIO,
  macroGoalToleranceGrams,
  macroInGoal,
  macroOverGoal,
  macroReached,
  macroRoomGrams,
  macroShortfallGrams,
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

assert(macroReached(147, 150), "low side counts as reached");
assert(macroReached(180, 160), "surplus still reached");
assert(!macroReached(146.9, 150), "past the low side");
assert(!macroReached(0, 160), "empty fact is not reached");
assert(!macroReached(10, 0), "no target is not reached");

assert(!macroOverGoal(153, 150), "high side is still in the band");
assert(macroOverGoal(153.1, 150), "past the high side");
assert(!macroOverGoal(140, 150), "a shortfall is not over");

assert(macroShortfallGrams(147, 150) === 0, "in-band shortfall is quiet");
assert(macroShortfallGrams(140, 150) === 10, "shortfall is the full gap");
assert(macroShortfallGrams(180, 150) === 0, "surplus has no shortfall");

assert(
  Math.abs(macroRoomGrams(150, 150) - 3) < 0.001,
  "room is the high side of the band",
);
assert(macroRoomGrams(160, 150) < 0, "past the band leaves no room");
assert(macroRoomGrams(10, 0) === -10, "missing target leaves no room");
