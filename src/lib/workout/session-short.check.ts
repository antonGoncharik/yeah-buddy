import {
  canShortenSession,
  readShortResult,
  shortSessionPlan,
} from "@/lib/workout/session-short";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const plan = shortSessionPlan([
  {
    id: "bench",
    muscle: "chest",
    sets: [
      { id: "w", set_type: "warmup", set_number: 1, is_completed: false },
      { id: "a", set_type: "work", set_number: 1, is_completed: true },
      { id: "b", set_type: "work", set_number: 2, is_completed: false },
      { id: "c", set_type: "work", set_number: 3, is_completed: false },
      { id: "d", set_type: "work", set_number: 4, is_completed: false },
    ],
  },
  {
    id: "row",
    muscle: "lats",
    sets: [
      { id: "r1", set_type: "work", set_number: 1, is_completed: false },
      { id: "r2", set_type: "work", set_number: 2, is_completed: false },
    ],
  },
  {
    id: "fly",
    muscle: "chest",
    sets: [{ id: "f1", set_type: "work", set_number: 1, is_completed: false }],
  },
]);

assertEqual(
  canShortenSession([
    {
      sets: [
        { set_type: "work", is_completed: false },
        { set_type: "work", is_completed: false },
        { set_type: "work", is_completed: false },
      ],
    },
  ]),
  true,
  "three open work sets can be shortened",
);
assertEqual(
  canShortenSession([
    {
      sets: [
        { set_type: "work", is_completed: true },
        { set_type: "work", is_completed: true },
      ],
    },
  ]),
  false,
  "two work sets are already short",
);
assertEqual(plan.dropSetIds, ["c", "d"], "two work sets stay, warmup stays");
assertEqual(
  plan.pairs,
  [["bench", "row"]],
  "a neighbour pair does not reuse an exercise",
);

assertEqual(
  shortSessionPlan([
    {
      id: "squat",
      muscle: "quads",
      sets: [
        { id: "s1", set_type: "work", set_number: 1, is_completed: false },
      ],
    },
    {
      id: "leg",
      muscle: "quads",
      sets: [
        { id: "l1", set_type: "work", set_number: 1, is_completed: false },
      ],
    },
  ]).pairs,
  [],
  "the same muscle is not a pair",
);

assertEqual(
  readShortResult({
    shortPairs: [["bench", "row"], "nope"],
    droppedSets: 2,
  }),
  { pairs: [["bench", "row"]], dropped: 2 },
  "only real pairs survive the payload",
);
