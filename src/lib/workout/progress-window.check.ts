import type { ExerciseProgress, ProgressPoint } from "@/lib/types";
import { windowStrengthProgress } from "@/lib/workout/progress-window";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function point(
  date: string,
  weight: number,
  relative: number | null = null,
): ProgressPoint {
  return {
    date,
    weight,
    seconds: null,
    tonnage: null,
    circle_tonnage: null,
    body_weight: relative == null ? null : Math.round(weight / relative),
    relative,
    phase_type: null,
    macro_number: null,
    label: date,
  };
}

function exercise(name: string, points: ProgressPoint[]): ExerciseProgress {
  return {
    exercise_id: name,
    name,
    category: "base",
    current_weight: points.at(-1)?.weight ?? null,
    start_weight: points[0]?.weight ?? null,
    delta: null,
    percent: null,
    current_relative: null,
    start_relative: null,
    relative_percent: null,
    current_tonnage: null,
    start_tonnage: null,
    tonnage_delta: null,
    tonnage_percent: null,
    points,
    from_work: true,
  };
}

const squat = exercise("Присед", [
  point("2026-08-20", 170, 2),
  point("2026-09-05", 175, 2.16),
  point("2026-09-12", 180, 2.22),
]);
const bench = exercise("Жим", [
  point("2026-08-01", 100),
  point("2026-08-20", 105),
]);
const row = exercise("Тяга", [
  point("2026-09-08", 90),
  point("2026-09-14", 90),
]);
const after = exercise("После", [point("2026-09-20", 200)]);

const windowed = windowStrengthProgress(
  {
    exercises: [squat, bench, row, after],
    grown_count: 0,
    avg_percent: null,
    avg_relative_percent: null,
  },
  "2026-09-01",
  "2026-09-14",
);

assertEqual(
  windowed.exercises.map((item) => item.name),
  ["Присед", "Тяга"],
  "only work in window",
);
assertEqual(windowed.exercises[0]?.start_weight, 170, "baseline before window");
assertEqual(windowed.exercises[0]?.current_weight, 180, "last in window");
assertEqual(windowed.grown_count, 1, "row stayed, squat grew");
assertEqual(windowed.exercises[1]?.percent, 0, "same bar in window is 0");
assertEqual(
  windowed.exercises[0]?.start_relative,
  2,
  "relative from baseline point",
);
assertEqual(
  windowed.exercises[0]?.current_relative,
  2.22,
  "relative from last in window",
);

const once = windowStrengthProgress(
  {
    exercises: [exercise("Раз", [point("2026-09-10", 60)])],
    grown_count: 0,
    avg_percent: null,
    avg_relative_percent: null,
  },
  "2026-09-01",
  "2026-09-14",
);
assertEqual(once.exercises[0]?.percent, 0, "one session without baseline");
assertEqual(once.grown_count, 0, "one session is not growth");

const recomp = windowStrengthProgress(
  {
    exercises: [
      exercise("Присед", [
        point("2026-08-20", 175, 2.08),
        point("2026-09-10", 175, 2.16),
      ]),
    ],
    grown_count: 0,
    avg_percent: null,
    avg_relative_percent: null,
  },
  "2026-09-01",
  "2026-09-14",
);
assertEqual(recomp.exercises[0]?.percent, 0, "bar unchanged");
assertEqual(
  Math.round((recomp.exercises[0]?.relative_percent ?? 0) * 10) / 10,
  3.8,
  "relative grew on same bar",
);

console.log("progress window ok");
