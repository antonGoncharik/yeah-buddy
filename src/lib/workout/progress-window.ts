import type {
  ExerciseProgress,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import { percentChange } from "@/lib/workout/numbers";
import { summarizeProgress } from "@/lib/workout/progress-build";
import { relativeSeries } from "@/lib/workout/progress-stats";

export function windowStrengthProgress(
  progress: StrengthProgress,
  from: string,
  to: string,
): StrengthProgress {
  const exercises = progress.exercises.flatMap((item) => {
    const next = windowExerciseProgress(item, from, to);
    return next ? [next] : [];
  });

  exercises.sort((left, right) => {
    const leftPercent = left.percent ?? Number.NEGATIVE_INFINITY;
    const rightPercent = right.percent ?? Number.NEGATIVE_INFINITY;
    if (rightPercent !== leftPercent) {
      return rightPercent - leftPercent;
    }
    return left.name.localeCompare(right.name, "ru");
  });

  return {
    exercises,
    ...summarizeProgress(exercises),
  };
}

function windowExerciseProgress(
  item: ExerciseProgress,
  from: string,
  to: string,
): ExerciseProgress | null {
  const points = [...item.points].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const inWindow = points.filter(
    (point) => point.date >= from && point.date <= to,
  );
  if (inWindow.length === 0) {
    return null;
  }

  const baseline = lastBefore(points, from);
  const series = baseline ? [baseline, ...inWindow] : inWindow;
  return progressFromSeries(item, series);
}

function lastBefore(
  points: ProgressPoint[],
  from: string,
): ProgressPoint | null {
  let found: ProgressPoint | null = null;
  for (const point of points) {
    if (point.date >= from) {
      break;
    }
    found = point;
  }
  return found;
}

function progressFromSeries(
  item: ExerciseProgress,
  points: ProgressPoint[],
): ExerciseProgress {
  const start_weight = points[0]?.weight ?? null;
  const current_weight = points.at(-1)?.weight ?? null;
  const delta =
    start_weight == null || current_weight == null
      ? null
      : current_weight - start_weight;
  const percent =
    start_weight == null || current_weight == null
      ? null
      : percentChange(start_weight, current_weight);
  const relatives = relativeSeries(points);
  const start_relative = relatives[0]?.relative ?? null;
  const current_relative = relatives.at(-1)?.relative ?? null;
  const relative_percent =
    start_relative == null || current_relative == null
      ? null
      : percentChange(start_relative, current_relative);
  const start_tonnage = points[0]?.tonnage ?? null;
  const current_tonnage = points.at(-1)?.tonnage ?? null;
  const tonnage_delta =
    start_tonnage == null || current_tonnage == null
      ? null
      : current_tonnage - start_tonnage;
  const tonnage_percent =
    start_tonnage == null || current_tonnage == null
      ? null
      : percentChange(start_tonnage, current_tonnage);

  return {
    ...item,
    current_weight,
    start_weight,
    delta,
    percent,
    current_relative,
    start_relative,
    relative_percent,
    current_tonnage,
    start_tonnage,
    tonnage_delta,
    tonnage_percent,
    points,
  };
}
