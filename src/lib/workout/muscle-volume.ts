import type { MuscleId, VolumeBand } from "@/lib/types";
import {
  volumeBandFromLandmarks,
  volumeLandmarksForMuscle,
} from "@/lib/workout/muscle-volume-landmarks";

export const VOLUME_BAND_LABELS: Record<VolumeBand, string> = {
  0: "Нет",
  1: "Мало",
  2: "Средне",
  3: "Норма",
  4: "Много",
};

/**
 * Weighted work sets per week.
 * `effectiveDays` shortens the divisor for a new lifter (at least 7, never
 * longer than the selected horizon) so the first week is not diluted.
 */
export function setsPerWeek(
  weightedSets: number,
  horizonDays: number,
  effectiveDays?: number,
): number {
  const days =
    effectiveDays != null && effectiveDays > 0
      ? Math.min(horizonDays, Math.max(7, effectiveDays))
      : horizonDays;
  const weeks = Math.max(days / 7, 1);
  return Math.round((weightedSets / weeks) * 10) / 10;
}

export function effectiveVolumeDays(
  horizonDays: number,
  firstSessionDate: string | null,
  today: string,
): number {
  if (firstSessionDate == null) {
    return horizonDays;
  }
  const start = Date.parse(`${firstSessionDate}T12:00:00Z`);
  const end = Date.parse(`${today}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return horizonDays;
  }
  const span = Math.round((end - start) / 86_400_000) + 1;
  return Math.min(horizonDays, Math.max(7, span));
}

export function volumeBandFromWeeklySets(
  setsPerWeek: number,
  muscleId?: MuscleId,
): VolumeBand {
  if (muscleId != null) {
    return volumeBandFromLandmarks(
      setsPerWeek,
      volumeLandmarksForMuscle(muscleId),
    );
  }
  if (setsPerWeek < 0.5) {
    return 0;
  }
  if (setsPerWeek < 4) {
    return 1;
  }
  if (setsPerWeek < 10) {
    return 2;
  }
  if (setsPerWeek <= 20) {
    return 3;
  }
  return 4;
}

export function weekCount(horizonDays: number): number {
  return Math.max(1, Math.ceil(horizonDays / 7));
}

export function weekIndexFromSince(since: string, date: string): number {
  const start = Date.parse(`${since}T12:00:00Z`);
  const end = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  const days = Math.round((end - start) / 86_400_000);
  return Math.floor(days / 7);
}
