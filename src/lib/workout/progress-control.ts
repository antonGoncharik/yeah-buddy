import {
  type BodyWeightWindow,
  bodyWeightOnOrBefore,
  weightDelta,
} from "@/lib/day/body-weight";
import { inclusiveDayCount, weekStartMonday } from "@/lib/day/dates";
import { diaryRangeStart } from "@/lib/diary-range";
import type {
  ExerciseProgress,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import { formatWorkDate } from "@/lib/workout/exercise-work-phase";
import { formatTonnage, formatWeight } from "@/lib/workout/numbers";
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

export type PeakRecord = {
  exercise_id: string;
  name: string;
  date: string;
  weight: number;
  previous: number;
};

export type WeekTonnage = {
  start: string;
  tonnage: number;
};

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

/**
 * Running max on recorded weights. The first point is the baseline, not a PR.
 * Later jumps inside [from, to] are the feed.
 */
export function peakRecords(
  exercises: ExerciseProgress[],
  from: string | null,
  to: string,
): PeakRecord[] {
  const found: PeakRecord[] = [];
  for (const item of exercises) {
    const points = [...item.points].sort((left, right) => {
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) {
        return byDate;
      }
      return left.weight - right.weight;
    });
    if (points.length < 2) {
      continue;
    }

    let peak = points[0]?.weight ?? 0;
    for (const point of points.slice(1)) {
      if (point.weight <= peak) {
        continue;
      }
      if ((from == null || point.date >= from) && point.date <= to) {
        found.push({
          exercise_id: item.exercise_id,
          name: item.name,
          date: point.date,
          weight: point.weight,
          previous: peak,
        });
      }
      peak = point.weight;
    }
  }

  found.sort((left, right) => {
    const byDate = right.date.localeCompare(left.date);
    if (byDate !== 0) {
      return byDate;
    }
    return left.name.localeCompare(right.name, "ru");
  });
  return found;
}

export function formatPeakRecord(
  row: Pick<PeakRecord, "name" | "date" | "weight" | "previous">,
): string {
  return `${row.name} · ${formatWorkDate(row.date)} · ${formatWeight(row.previous)} → ${formatWeight(row.weight)} кг`;
}

export function weeklyTonnage(
  exercises: ExerciseProgress[],
  from: string | null,
  to: string,
): WeekTonnage[] {
  const byWeek = new Map<string, number>();
  for (const item of exercises) {
    for (const point of item.points) {
      if (point.tonnage == null || point.tonnage <= 0) {
        continue;
      }
      if (from != null && point.date < from) {
        continue;
      }
      if (point.date > to) {
        continue;
      }
      const start = weekStartMonday(point.date);
      byWeek.set(start, (byWeek.get(start) ?? 0) + point.tonnage);
    }
  }

  return [...byWeek.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([start, tonnage]) => ({ start, tonnage: Math.round(tonnage) }));
}

export function totalTonnage(weeks: WeekTonnage[]): number {
  return weeks.reduce((sum, week) => sum + week.tonnage, 0);
}

export function formatWeeklyTonnageLine(weeks: WeekTonnage[]): string | null {
  if (weeks.length < 2) {
    return null;
  }

  return weeks
    .slice(-8)
    .map((week) => formatTonnage(week.tonnage))
    .join(" → ");
}

export function uniqueWorkDates(exercises: ExerciseProgress[]): string[] {
  const dates = new Set<string>();
  for (const item of exercises) {
    for (const point of item.points) {
      if (isWorkPoint(point)) {
        dates.add(point.date);
      }
    }
  }
  return [...dates].sort();
}

export function horizonDayCount(
  from: string | null,
  to: string,
  firstDate: string | undefined,
): number {
  const start = from ?? firstDate;
  if (!start) {
    return 0;
  }
  return inclusiveDayCount(start, to);
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

function isWorkPoint(point: ProgressPoint): boolean {
  return point.kind != null || point.tonnage != null;
}
