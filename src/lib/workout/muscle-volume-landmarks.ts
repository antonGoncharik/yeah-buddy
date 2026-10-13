import type { MuscleId, VolumeBand } from "@/lib/types";

/** Weekly direct sets — RP-style MEV / MAV / MRV (approximate, per muscle). */
export type MuscleVolumeLandmarks = {
  mev: number;
  mav: number;
  mrv: number;
};

const LARGE: MuscleVolumeLandmarks = { mev: 8, mav: 16, mrv: 22 };
const MEDIUM: MuscleVolumeLandmarks = { mev: 6, mav: 12, mrv: 18 };
const SMALL: MuscleVolumeLandmarks = { mev: 4, mav: 10, mrv: 16 };
const CORE: MuscleVolumeLandmarks = { mev: 4, mav: 8, mrv: 14 };

const LANDMARKS: Record<MuscleId, MuscleVolumeLandmarks> = {
  chest: LARGE,
  lats: LARGE,
  upper_back: MEDIUM,
  traps: SMALL,
  lower_back: SMALL,
  abs: CORE,
  obliques: CORE,
  front_delts: MEDIUM,
  side_delts: MEDIUM,
  rear_delts: SMALL,
  subscapularis: SMALL,
  biceps: SMALL,
  triceps: MEDIUM,
  forearms: SMALL,
  quads: LARGE,
  hamstrings: MEDIUM,
  glutes: MEDIUM,
  adductors: SMALL,
  calves: SMALL,
};

export type MuscleSize = "large" | "medium" | "small";

export function volumeLandmarksForMuscle(id: MuscleId): MuscleVolumeLandmarks {
  return LANDMARKS[id];
}

/** Weekly thresholds in the same units as weighted sets per week. */
export function muscleVolumeLandmarkLine(id: MuscleId): string {
  const marks = volumeLandmarksForMuscle(id);
  return `Мало до ${marks.mev} · ниже зоны до ${marks.mav} · в зоне до ${marks.mrv} · дальше много, подх./нед`;
}

/** Large muscles stay sore longer. Core recovers with the small muscles. */
export function muscleSize(id: MuscleId): MuscleSize {
  const landmarks = LANDMARKS[id];
  if (landmarks === LARGE) {
    return "large";
  }
  if (landmarks === MEDIUM) {
    return "medium";
  }
  return "small";
}

export function volumeBandFromLandmarks(
  setsPerWeek: number,
  landmarks: MuscleVolumeLandmarks,
): VolumeBand {
  if (setsPerWeek < 0.5) {
    return 0;
  }
  if (setsPerWeek < landmarks.mev) {
    return 1;
  }
  if (setsPerWeek < landmarks.mav) {
    return 2;
  }
  if (setsPerWeek <= landmarks.mrv) {
    return 3;
  }
  return 4;
}
