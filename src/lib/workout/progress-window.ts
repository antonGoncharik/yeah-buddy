import type {
  ExerciseProgress,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import {
  measureProgress,
  summarizeProgress,
} from "@/lib/workout/progress-build";
import { lastProgressKind, pointsForKind } from "@/lib/workout/progress-stats";

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
    weights: progress.weights ?? [],
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

  const kind = lastProgressKind(inWindow);
  const comparable = pointsForKind(points, kind);
  const inWindowKind = comparable.filter(
    (point) => point.date >= from && point.date <= to,
  );
  const baseline = lastBefore(comparable, from);
  const series = baseline ? [baseline, ...inWindowKind] : inWindowKind;
  return {
    ...item,
    ...measureProgress(series),
    points: inWindow,
  };
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
