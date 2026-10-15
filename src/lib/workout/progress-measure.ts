import type { ExerciseProgress, ProgressPoint } from "@/lib/types";
import { percentChange } from "@/lib/workout/numbers";
import { relativeSeries } from "@/lib/workout/progress-stats";

const E1RM_FLAT_WEIGHT_PCT = 0.5;
const GROWN_PERCENT = 0.5;
/** Bar (and estimate, when both exist) this far under the other sessions is a light day, not a loss of strength. */
const LIGHT_RATIO = 0.88;

function peakValue(
  points: ProgressPoint[],
  pick: (point: ProgressPoint) => number | null,
): number | null {
  let peak: number | null = null;
  for (const point of points) {
    const value = pick(point);
    if (value == null || value <= 0) {
      continue;
    }
    peak = peak == null ? value : Math.max(peak, value);
  }
  return peak;
}

/** Lighter than the sessions next to it, on the bar and on the estimate. Rep changes that keep the estimate stay in. */
function isLightAgainst(
  point: ProgressPoint,
  others: ProgressPoint[],
): boolean {
  const weightPeak = peakValue(others, (item) => item.weight);
  if (weightPeak == null || point.weight >= weightPeak * LIGHT_RATIO) {
    return false;
  }
  const e1rmPeak = peakValue(others, (item) => item.e1rm);
  if (
    point.e1rm != null &&
    e1rmPeak != null &&
    point.e1rm >= e1rmPeak * LIGHT_RATIO
  ) {
    return false;
  }
  return true;
}

/**
 * Sessions used to answer «сильнее ли стал».
 * Leading and trailing light days drop out; the chart still draws every point.
 * Phase names are not involved — any cycle, or no cycle, uses the same rule.
 */
export function comparableWorkPoints(points: ProgressPoint[]): ProgressPoint[] {
  if (points.length < 2) {
    return points;
  }

  let start = 0;
  let end = points.length - 1;
  while (end > start) {
    const candidate = points[end];
    if (!candidate || !isLightAgainst(candidate, points.slice(start, end))) {
      break;
    }
    end -= 1;
  }
  while (start < end) {
    const candidate = points[start];
    if (
      !candidate ||
      !isLightAgainst(candidate, points.slice(start + 1, end + 1))
    ) {
      break;
    }
    start += 1;
  }

  const sliced = points.slice(start, end + 1);
  return sliced.length > 0 ? sliced : points;
}

export function lastComparableBefore(
  points: ProgressPoint[],
  from: string,
): ProgressPoint | null {
  const prior: ProgressPoint[] = [];
  for (const point of points) {
    if (point.date >= from) {
      break;
    }
    prior.push(point);
  }
  return comparableWorkPoints(prior).at(-1) ?? null;
}

export function strengthGrown(
  item: Pick<ExerciseProgress, "percent" | "relative_percent">,
): boolean {
  return (
    (item.percent ?? 0) > GROWN_PERCENT ||
    (item.relative_percent ?? 0) > GROWN_PERCENT
  );
}

function blendPercent(
  weightPercent: number | null,
  startE1rm: number | null,
  endE1rm: number | null,
): number | null {
  if (weightPercent == null) {
    return startE1rm == null || endE1rm == null
      ? null
      : percentChange(startE1rm, endE1rm);
  }
  if (
    Math.abs(weightPercent) < E1RM_FLAT_WEIGHT_PCT &&
    startE1rm != null &&
    endE1rm != null &&
    startE1rm > 0
  ) {
    const e1rmPercent = percentChange(startE1rm, endE1rm);
    if (e1rmPercent != null && Math.abs(e1rmPercent) >= E1RM_FLAT_WEIGHT_PCT) {
      return e1rmPercent;
    }
  }
  return weightPercent;
}

export function measureProgress(
  points: ProgressPoint[],
): Pick<
  ExerciseProgress,
  | "current_weight"
  | "start_weight"
  | "delta"
  | "percent"
  | "current_relative"
  | "start_relative"
  | "relative_percent"
  | "current_tonnage"
  | "start_tonnage"
  | "tonnage_delta"
  | "tonnage_percent"
> {
  const series = comparableWorkPoints(points);
  const start_weight = series[0]?.weight ?? null;
  const current_weight = series.at(-1)?.weight ?? null;
  const delta =
    start_weight == null || current_weight == null
      ? null
      : current_weight - start_weight;
  const weightPercent =
    start_weight == null || current_weight == null
      ? null
      : percentChange(start_weight, current_weight);
  const startE1rm = series[0]?.e1rm ?? null;
  const endE1rm = series.at(-1)?.e1rm ?? null;
  const percent = blendPercent(weightPercent, startE1rm, endE1rm);

  const relatives = relativeSeries(series);
  const start_relative = relatives[0]?.relative ?? null;
  const current_relative = relatives.at(-1)?.relative ?? null;
  const relative_percent =
    start_relative == null || current_relative == null
      ? null
      : percentChange(start_relative, current_relative);

  const start_tonnage = series[0]?.tonnage ?? null;
  const current_tonnage = series.at(-1)?.tonnage ?? null;
  const tonnage_delta =
    start_tonnage == null || current_tonnage == null
      ? null
      : current_tonnage - start_tonnage;
  const tonnage_percent =
    start_tonnage == null || current_tonnage == null
      ? null
      : percentChange(start_tonnage, current_tonnage);

  const displayCurrent = points.at(-1)?.weight ?? current_weight;
  const displayStart = points[0]?.weight ?? start_weight;

  return {
    current_weight: displayCurrent,
    start_weight: displayStart,
    delta,
    percent,
    current_relative,
    start_relative,
    relative_percent,
    current_tonnage,
    start_tonnage,
    tonnage_delta,
    tonnage_percent,
  };
}
