import {
  activeSoreMarks,
  readEaseSoreResult,
  soreMuscles,
  sorePlannedWeight,
  soreUntil,
} from "@/lib/workout/sore";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(soreUntil("2026-10-15"), "2026-10-21", "a week of a sore spot");
assertEqual(
  activeSoreMarks(
    [
      { id: "shoulder", until: "2026-10-21", easedSessionIds: [] },
      { id: "knee", until: "2026-10-14", easedSessionIds: [] },
    ],
    "2026-10-15",
  ).map((mark) => mark.id),
  ["shoulder"],
  "an expired spot drops off",
);
assertEqual(
  soreMuscles([{ id: "elbow", until: "2026-10-21", easedSessionIds: [] }]),
  ["biceps", "triceps", "forearms"],
  "an elbow covers the arm",
);
assertEqual(sorePlannedWeight(100, 2.5), 85, "fifteen percent on the plates");
assertEqual(
  sorePlannedWeight(20, 2.5),
  15,
  "a light weight steps down to the plate",
);
assertEqual(
  readEaseSoreResult({ easedSets: 3 }).eased,
  3,
  "ease response carries a set count",
);
