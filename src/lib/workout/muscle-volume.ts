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

/** Weighted work sets per calendar week (7 days from period start). */
export function setsPerWeek(weightedSets: number, horizonDays: number): number {
  const weeks = Math.max(horizonDays / 7, 1);
  return Math.round((weightedSets / weeks) * 10) / 10;
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
