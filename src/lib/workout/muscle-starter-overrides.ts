import type { MuscleId } from "@/lib/types";

type MuscleWeights = Partial<Record<MuscleId, number>>;

/**
 * Curated weights for starter catalog ids (source_exercise_id).
 * Absolute weights: primary ≈ 1, secondary 0.25–0.5. Not normalized to sum 1.
 */
export const STARTER_MUSCLE_BY_SOURCE_ID: Record<string, MuscleWeights> = {
  "0043": { quads: 1, glutes: 1, hamstrings: 0.35 }, // squat
  "0743": { quads: 1, glutes: 1, hamstrings: 0.35 }, // hack squat
  "3119": { quads: 1, glutes: 0.85, hamstrings: 0.25 },
  "0739": { quads: 1, glutes: 0.85, hamstrings: 0.35 }, // leg press
  "0054": { quads: 0.85, glutes: 1, hamstrings: 0.35 }, // lunge
  "0585": { quads: 1, hamstrings: 0.25 },
  "0586": { hamstrings: 1, glutes: 0.35 },
  "0032": {
    hamstrings: 1,
    glutes: 1,
    lower_back: 0.75,
    upper_back: 0.5,
    traps: 0.5,
  },
  "0085": { hamstrings: 1, glutes: 0.85, lower_back: 0.5 },
  "0025": { chest: 1, triceps: 0.5, front_delts: 0.45 },
  "0047": { chest: 1, triceps: 0.45, front_delts: 0.5 },
  "0289": { chest: 1, triceps: 0.45, front_delts: 0.4 },
  "0314": { chest: 1, triceps: 0.4, front_delts: 0.45 },
  "0030": { triceps: 1, chest: 0.45, front_delts: 0.25 },
  "0662": { chest: 1, triceps: 0.5, front_delts: 0.35 },
  "0814": { triceps: 1, chest: 0.45, front_delts: 0.35 },
  "0259": { triceps: 1, chest: 0.4 },
  "1457": { front_delts: 1, side_delts: 0.45, triceps: 0.45, upper_back: 0.25 },
  "0426": { front_delts: 1, side_delts: 0.4, triceps: 0.45 },
  "0405": { front_delts: 1, triceps: 0.4 },
  "0334": { side_delts: 1, traps: 0.25 },
  "0378": { rear_delts: 1, upper_back: 0.45, traps: 0.25 },
  "0602": { rear_delts: 1, upper_back: 0.35 },
  "0310": { front_delts: 1 },
  "0120": { side_delts: 1, traps: 0.45, biceps: 0.25 },
  "0095": { traps: 1, upper_back: 0.35 },
  "0027": { upper_back: 1, lats: 0.65, biceps: 0.35, rear_delts: 0.25 },
  "0293": { lats: 0.85, upper_back: 0.65, biceps: 0.35 },
  "0861": { upper_back: 1, lats: 0.65, biceps: 0.35 },
  "0606": { upper_back: 1, lats: 0.55, rear_delts: 0.25 },
  "0198": { lats: 1, biceps: 0.4, upper_back: 0.35 },
  "0652": { lats: 1, biceps: 0.45, upper_back: 0.25 },
  "0499": { upper_back: 0.85, lats: 0.65, biceps: 0.35, rear_delts: 0.25 },
  "0031": { biceps: 1, forearms: 0.25 },
  "0294": { biceps: 1, forearms: 0.25 },
  "0313": { biceps: 1, forearms: 0.3 },
  "0070": { biceps: 1 },
  "0297": { biceps: 1 },
  "0060": { triceps: 1, front_delts: 0.2 },
  "0201": { triceps: 1 },
  "1372": { calves: 1 },
  "0594": { calves: 1 },
  "0489": { lower_back: 0.75, hamstrings: 0.65, glutes: 0.55 },
  "0175": { abs: 1, obliques: 0.45 },
  "0274": { abs: 1 },
  "0464": { abs: 1, lower_back: 0.35 },
  "0488": { lower_back: 0.65, glutes: 0.45, hamstrings: 0.35 },
  "3013": { glutes: 1, hamstrings: 0.45 },
  "0227": { chest: 1, front_delts: 0.35 },
  "0308": { chest: 1, front_delts: 0.3 },
  "0375": { lats: 0.65, chest: 0.45 },
  "0576": { chest: 1, triceps: 0.4 },
};

export function starterMuscleOverride(
  sourceExerciseId: string | null,
): MuscleWeights | null {
  if (!sourceExerciseId) {
    return null;
  }
  const weights = STARTER_MUSCLE_BY_SOURCE_ID[sourceExerciseId];
  if (!weights || Object.keys(weights).length === 0) {
    return null;
  }
  return { ...weights };
}
