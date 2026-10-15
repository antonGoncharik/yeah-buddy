import type { ProgressPoint } from "@/lib/types";
import { measureProgress } from "@/lib/workout/progress-measure";

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
  phase: string | null,
  e1rm: number | null = null,
): ProgressPoint {
  return {
    date,
    weight,
    e1rm,
    seconds: null,
    tonnage: null,
    circle_tonnage: null,
    body_weight: null,
    relative: null,
    phase_type: phase,
    macro_number: 1,
    label: date,
  };
}

const cycle = [
  point("2026-09-11", 135, "ramp"),
  point("2026-09-21", 135, "volume"),
  point("2026-09-30", 135, "peak"),
  point("2026-10-07", 92.5, "deload"),
];

const bench = measureProgress(cycle);
assertEqual(bench.percent, 0, "deload end does not fake regression");
assertEqual(bench.delta, 0, "bench flat across work phases");
assertEqual(bench.current_weight, 92.5, "last session weight still shown");

const squat = measureProgress([
  point("2026-09-07", 200, "ramp", 220),
  point("2026-09-25", 210, "peak", 231),
  point("2026-10-05", 142.5, "deload", 166),
  point("2026-10-14", 210, "ramp", 231),
]);
assertEqual(squat.delta, 10, "squat grew across cycles");
assertEqual(Math.round(squat.percent ?? 0), 5, "squat percent");

const e1rmOnly = measureProgress([
  point("2026-09-07", 200, "ramp", 220),
  point("2026-09-16", 200, "volume", 233),
]);
assertEqual(e1rmOnly.delta, 0, "same bar");
assertEqual(
  Math.round((e1rmOnly.percent ?? 0) * 10) / 10,
  5.9,
  "e1rm growth when bar flat",
);

const onlyDeload = measureProgress([point("2026-10-07", 92.5, "deload")]);
assertEqual(onlyDeload.percent, 0, "single deload point");

const customLight = measureProgress([
  point("2026-09-11", 80, "p1"),
  point("2026-09-18", 80, "p2"),
  point("2026-09-25", 70, "light"),
]);
assertEqual(customLight.percent, 0, "a light week by weight, any phase key");
assertEqual(customLight.current_weight, 70, "light week still the last dot");

const lost = measureProgress([
  point("2026-09-01", 100, null),
  point("2026-09-08", 95, null),
  point("2026-09-15", 90, null),
]);
assertEqual(Math.round(lost.percent ?? 0), -10, "a real slide still counts");

console.log("progress measure ok");
