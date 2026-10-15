import {
  forgetPair,
  nextFocusSetId,
  pairWith,
  pruneSessionPairs,
} from "@/lib/workout/session-pairs";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const paired = pairWith({}, "bench", "row");
assertEqual(paired.bench, "row", "bench points at the row");
assertEqual(paired.row, "bench", "the row points back");
assertEqual(forgetPair(paired, "bench"), {}, "unpairing clears both sides");
assertEqual(
  pruneSessionPairs({ bench: "row", row: "bench", dead: "curl" }, new Set(["bench", "row"])),
  paired,
  "prune drops stale exercise ids",
);

const exercises = [
  {
    id: "bench",
    sets: [
      { id: "b1", set_type: "work", is_completed: true },
      { id: "b2", set_type: "work", is_completed: false },
    ],
  },
  {
    id: "row",
    sets: [{ id: "r1", set_type: "work", is_completed: false }],
  },
];
assertEqual(
  nextFocusSetId(exercises, "bench", "b1", "row"),
  "r1",
  "a pair jumps to the other exercise",
);
assertEqual(
  nextFocusSetId(exercises, "bench", "b1", null),
  "b2",
  "alone, the next set is on the same exercise",
);
