import { bodyWeightOnOrBefore, relativeStrength } from "@/lib/day/body-weight";
import type {
  ExerciseCategory,
  ExerciseProgress,
  ProgressPoint,
} from "@/lib/types";

export type ProgressMetric = "weight" | "seconds" | "relative";

export const CATEGORY_SHORT_LABELS: Record<ExerciseCategory, string> = {
  base: "База",
  isolation: "Изол.",
};

const CATEGORY_ORDER: ExerciseCategory[] = ["base", "isolation"];

export function categoryAverages(
  exercises: ExerciseProgress[],
): Array<{ id: ExerciseCategory; avg_percent: number }> {
  return CATEGORY_ORDER.flatMap((id) => {
    const percents = exercises.flatMap((item) =>
      item.category === id && item.percent != null ? [item.percent] : [],
    );
    if (percents.length === 0) {
      return [];
    }

    return [
      {
        id,
        avg_percent:
          percents.reduce((sum, value) => sum + value, 0) / percents.length,
      },
    ];
  });
}

export function secondsSeries(points: ProgressPoint[]): ProgressPoint[] {
  return points.filter((point) => point.seconds != null && point.seconds > 0);
}

export function hasSecondsSeries(points: ProgressPoint[]): boolean {
  return secondsSeries(points).length >= 2;
}

export function relativeSeries(points: ProgressPoint[]): ProgressPoint[] {
  return points.filter((point) => point.relative != null && point.relative > 0);
}

export function hasRelativeSeries(points: ProgressPoint[]): boolean {
  return relativeSeries(points).length >= 2;
}

export function metricPoints(
  points: ProgressPoint[],
  metric: ProgressMetric,
): ProgressPoint[] {
  if (metric === "seconds") {
    return secondsSeries(points);
  }
  if (metric === "relative") {
    return relativeSeries(points);
  }
  return points;
}

export function metricValues(
  points: ProgressPoint[],
  metric: ProgressMetric,
): number[] {
  if (metric === "seconds") {
    return secondsSeries(points).map((point) => point.seconds ?? 0);
  }
  if (metric === "relative") {
    return relativeSeries(points).map((point) => point.relative ?? 0);
  }

  return points.map((point) => point.weight);
}

export function withRelativePoints(
  points: ProgressPoint[],
  weights: Array<{ date: string; weight: number }>,
): ProgressPoint[] {
  return points.map((point) => {
    const body = bodyWeightOnOrBefore(weights, point.date);
    return {
      ...point,
      body_weight: body,
      relative: body == null ? null : relativeStrength(point.weight, body),
    };
  });
}
