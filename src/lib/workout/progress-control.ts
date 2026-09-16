import {
  type BodyWeightWindow,
  bodyWeightOnOrBefore,
  weightDelta,
} from "@/lib/day/body-weight";
import { diaryRangeStart } from "@/lib/diary-range";
import type { ExerciseProgress, StrengthProgress } from "@/lib/types";
import { windowStrengthProgress } from "@/lib/workout/progress-window";

export type ProgressHorizon = "30" | "90" | "all";

export const PROGRESS_HORIZON_OPTIONS: Array<{
  id: ProgressHorizon;
  label: string;
}> = [
  { id: "30", label: "30 дн" },
  { id: "90", label: "90 дн" },
  { id: "all", label: "Всё" },
];

export function viewedProgress(
  progress: StrengthProgress,
  todayIso: string,
  horizon: ProgressHorizon,
): StrengthProgress {
  if (horizon === "all") {
    return progress;
  }

  const from = diaryRangeStart(todayIso, Number(horizon));
  if (!from) {
    return progress;
  }

  return windowStrengthProgress(progress, from, todayIso);
}

export function controlLifts(
  exercises: ExerciseProgress[],
): ExerciseProgress[] {
  const base = exercises.filter((item) => item.category === "base");
  const source = base.length > 0 ? base : exercises;
  return source.slice(0, 6);
}

/** Last window weight is a new all-time high, not just matching an old peak. */
export function isNewPeak(
  lifetime: ExerciseProgress,
  viewed: ExerciseProgress,
): boolean {
  const current = viewed.current_weight;
  if (
    current == null ||
    (viewed.delta ?? 0) <= 0 ||
    lifetime.points.length < 2
  ) {
    return false;
  }

  const peak = Math.max(...lifetime.points.map((point) => point.weight));
  return current >= peak;
}

export function bodyWeightSpan(
  weights: Array<{ date: string; weight: number }>,
  from: string | null,
  to: string,
): Pick<BodyWeightWindow, "logged" | "start" | "end" | "delta"> {
  const inRange = weights.filter(
    (row) => (from == null || row.date >= from) && row.date <= to,
  );
  const start =
    from == null
      ? (weights[0]?.weight ?? null)
      : (weights.find((row) => row.date === from)?.weight ??
        bodyWeightOnOrBefore(weights, from) ??
        inRange[0]?.weight ??
        null);
  const end =
    inRange.at(-1)?.weight ?? (from ? bodyWeightOnOrBefore(weights, to) : null);

  return {
    logged: inRange.length,
    start,
    end,
    delta: weightDelta(start, end),
  };
}
