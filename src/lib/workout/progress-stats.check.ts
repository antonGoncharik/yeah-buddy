import { withRelativePoints } from "@/lib/workout/progress-stats";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const points = withRelativePoints(
  [
    {
      date: "2026-09-03",
      weight: 175,
      seconds: null,
      body_weight: null,
      relative: null,
      phase_type: null,
      macro_number: null,
      label: "3 сен",
    },
    {
      date: "2026-09-10",
      weight: 175,
      seconds: null,
      body_weight: null,
      relative: null,
      phase_type: null,
      macro_number: null,
      label: "10 сен",
    },
  ],
  [
    { date: "2026-09-01", weight: 84 },
    { date: "2026-09-10", weight: 81 },
  ],
);

assertEqual(points[0]?.body_weight, 84, "carry to gym day");
assertEqual(points[0]?.relative, 2.08, "175 / 84");
assertEqual(points[1]?.body_weight, 81, "same-day weight");
assertEqual(points[1]?.relative, 2.16, "175 / 81");

console.log("progress relative ok");
