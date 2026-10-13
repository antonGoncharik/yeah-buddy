import type { MuscleId } from "@/lib/types";
import { foldExerciseName } from "@/lib/workout/muscle-catalog-map";

type MuscleWeights = Partial<Record<MuscleId, number>>;

/**
 * Exact names the generic matcher misses or misreads.
 * Primary ≈ 1, secondary 0.25–0.5. Keys are folded exercise names.
 */
const MUSCLE_BY_FOLDED_NAME: Record<string, MuscleWeights> = {
  "сгибание проксимальный фаланг пальцев с ручкой на лямках на блоке": {
    forearms: 1,
  },
  "сгибание кисти с ручкой на лямках на блоке": { forearms: 1 },
  "сгибание кисти с ручкой ларратта": { forearms: 1 },
  "отведение кисти на блоке": { forearms: 1 },
  "пронация предплечья с лямкой на блоке": { forearms: 1 },
  "подъем на плечелучевую с лямкой с нижнего блока": {
    forearms: 1,
    biceps: 0.45,
  },
  "боковой нажим корпусом": {
    chest: 1,
    front_delts: 1,
    subscapularis: 1,
    triceps: 0.5,
    biceps: 0.45,
    forearms: 0.4,
    obliques: 0.35,
  },
  "махи с гантелями на среднюю дельту": { side_delts: 1, traps: 0.25 },
  "махи с гантелями на заднюю дельту": {
    rear_delts: 1,
    upper_back: 0.4,
    traps: 0.25,
  },
  "жим со штангой сидя": {
    front_delts: 1,
    side_delts: 0.45,
    triceps: 0.45,
    upper_back: 0.25,
  },
};

export function nameMuscleOverride(
  names: Array<string | null | undefined>,
): MuscleWeights | null {
  for (const raw of names) {
    if (raw == null || raw.trim() === "") {
      continue;
    }
    const weights = MUSCLE_BY_FOLDED_NAME[foldExerciseName(raw)];
    if (weights && Object.keys(weights).length > 0) {
      return { ...weights };
    }
  }
  return null;
}
