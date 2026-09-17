import { shouldAutoEndPhase } from "@/lib/workout/phase-auto-end";

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label);
  }
}

const ready = {
  suggest_end: true,
  last_in_cycle: false,
  increases_on_end: false,
};

assert(
  shouldAutoEndPhase(true, ready),
  "after a round the next week starts itself",
);
assert(!shouldAutoEndPhase(false, ready), "manual weeks wait for a tap");
assert(
  !shouldAutoEndPhase(true, { ...ready, suggest_end: false }),
  "the round is not finished yet",
);
assert(
  !shouldAutoEndPhase(true, { ...ready, last_in_cycle: true }),
  "the last week waits so the person can close the cycle",
);
assert(
  !shouldAutoEndPhase(true, { ...ready, increases_on_end: true }),
  "a 1ПМ bump waits for a look at the weights",
);
assert(!shouldAutoEndPhase(true, null), "no progress, no auto-end");

console.log("phase auto-end ok");
