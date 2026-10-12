import {
  sessionBlocksSetPatch,
  shouldReturnCompletedSessionAsIs,
} from "@/lib/workout/session-complete";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

assert(sessionBlocksSetPatch("completed"), "completed blocks set patch");
assert(!sessionBlocksSetPatch("planned"), "planned allows set patch");

assert(
  shouldReturnCompletedSessionAsIs("completed", {}),
  "repeat complete with empty body is idempotent",
);
assert(
  !shouldReturnCompletedSessionAsIs("completed", {
    sets: [{ id: "00000000-0000-4000-8000-000000000001" }],
  }),
  "complete with set overrides corrects session",
);
assert(
  !shouldReturnCompletedSessionAsIs("completed", { note: "fixed" }),
  "note update is not idempotent",
);
assert(
  !shouldReturnCompletedSessionAsIs("planned", {}),
  "planned session never short-circuits",
);

console.log("session complete ok");
