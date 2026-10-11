import type { MuscleId } from "@/lib/types";
import {
  muscleSize,
  volumeLandmarksForMuscle,
} from "@/lib/workout/muscle-volume-landmarks";

/** 0–100: higher = more recovered and ready for hard work. */
export function muscleRecoveryPercent(input: {
  muscleId: MuscleId;
  days_since: number | null;
  sets_per_week: number;
  sets: number;
}): number | null {
  if (input.sets <= 0 || input.days_since == null) {
    return null;
  }

  const size = muscleSize(input.muscleId);
  const landmarks = volumeLandmarksForMuscle(input.muscleId);
  const fromRecency = recencyFactor(input.days_since, size);
  const drag = volumeDrag(input.sets_per_week, landmarks);

  return Math.round(Math.min(100, fromRecency * drag * 100));
}

function recencyFactor(
  days: number,
  size: "large" | "medium" | "small",
): number {
  if (size === "large") {
    if (days <= 1) {
      return 0.4;
    }
    if (days === 2) {
      return 0.58;
    }
    if (days === 3) {
      return 0.74;
    }
    if (days <= 5) {
      return 0.88;
    }
    return 1;
  }
  if (size === "small") {
    if (days <= 1) {
      return 0.62;
    }
    if (days === 2) {
      return 0.84;
    }
    if (days <= 3) {
      return 0.94;
    }
    return 1;
  }
  if (days <= 1) {
    return 0.5;
  }
  if (days === 2) {
    return 0.72;
  }
  if (days === 3) {
    return 0.85;
  }
  if (days <= 5) {
    return 0.94;
  }
  return 1;
}

function volumeDrag(
  setsPerWeek: number,
  landmarks: { mev: number; mav: number; mrv: number },
): number {
  if (setsPerWeek > landmarks.mrv) {
    return 0.82;
  }
  if (setsPerWeek > landmarks.mav) {
    return 0.9;
  }
  if (setsPerWeek > landmarks.mev) {
    return 0.96;
  }
  return 1;
}
