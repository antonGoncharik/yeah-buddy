import type { MuscleId } from "@/lib/types";
import type { ExerciseMuscleMeta } from "@/lib/workout/muscle-aggregate";
import {
  applyCompoundGluteTargetFix,
  foldExerciseName,
  isIsolationCatalogTarget,
  mapCatalogSecondary,
  mapCatalogTarget,
  secondaryMuscleWeight,
} from "@/lib/workout/muscle-catalog-map";
import { starterMuscleOverride } from "@/lib/workout/muscle-starter-overrides";
import { resolveExerciseMuscles } from "@/lib/workout/muscle-taxonomy";

type MuscleWeights = Partial<Record<MuscleId, number>>;

const PRIMARY_WEIGHT = 1;

export function resolveExerciseMuscleWeights(
  meta: ExerciseMuscleMeta,
): Partial<Record<MuscleId, number>> {
  const override = starterMuscleOverride(meta.source_exercise_id);
  if (override) {
    return override;
  }

  const fromCatalog = weightsFromCatalog(meta);
  if (fromCatalog && Object.keys(fromCatalog).length > 0) {
    return fromCatalog;
  }

  return resolveExerciseMuscles({
    body_part: meta.body_part,
    name_en: meta.name_en,
    name_ru: meta.name_ru,
    equipment: meta.equipment,
  });
}

function weightsFromCatalog(meta: ExerciseMuscleMeta): MuscleWeights | null {
  const target = meta.target?.trim();
  if (!target) {
    return null;
  }

  const nameFolded = foldExerciseName(
    `${meta.name_ru ?? ""} ${meta.name_en ?? ""} ${meta.name}`,
  );
  const primaryId = mapCatalogTarget(target, nameFolded);
  if (!primaryId) {
    return null;
  }

  const isolation = isIsolationCatalogTarget(target);
  const weights: MuscleWeights = {
    [primaryId]: PRIMARY_WEIGHT,
  };

  for (const label of meta.secondary_muscles ?? []) {
    const muscleId = mapCatalogSecondary(label, nameFolded);
    if (!muscleId) {
      continue;
    }
    const add = secondaryMuscleWeight(muscleId, isolation);
    weights[muscleId] = Math.max(weights[muscleId] ?? 0, add);
  }

  return applyCompoundGluteTargetFix(nameFolded, target, weights);
}
