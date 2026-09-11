import type { ExerciseWithMax } from "@/lib/types";
import {
  isProgramPresetId,
  type ProgramPresetId,
  programPresetById,
  programPresetExerciseNames,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

export type OnboardingCircleChoice = ProgramPresetId | "empty";

export function defaultOnboardingCircle(
  circle: OnboardingCircleChoice,
  replay: boolean,
): OnboardingCircleChoice {
  if (replay || circle !== "empty") {
    return circle;
  }
  return RECOMMENDED_PROGRAM_PRESET_ID;
}

export function isExtraProgram(circle: OnboardingCircleChoice): boolean {
  if (!isProgramPresetId(circle)) {
    return false;
  }
  return programPresetById(circle)?.level !== "beginner";
}

export function exercisesForCircle(
  circle: OnboardingCircleChoice,
  catalog: ExerciseWithMax[],
): ExerciseWithMax[] {
  if (!isProgramPresetId(circle)) {
    return [];
  }

  const byName = new Map(
    catalog.map((exercise) => [exercise.name, exercise] as const),
  );
  return programPresetExerciseNames(circle).flatMap((name) => {
    const exercise = byName.get(name);
    return exercise ? [exercise] : [];
  });
}

export const ONBOARDING_WEIGHT_NAMES = [
  "Приседания со штангой",
  "Жим лёжа",
  "Тяга штанги в наклоне",
  "Становая тяга",
] as const;

export function onboardingWeightExercises(
  circle: OnboardingCircleChoice,
  catalog: ExerciseWithMax[],
): ExerciseWithMax[] {
  const inCircle = exercisesForCircle(circle, catalog).filter(
    (exercise) => exercise.category === "base",
  );
  const byName = new Map(
    inCircle.map((exercise) => [exercise.name, exercise] as const),
  );
  const primary = ONBOARDING_WEIGHT_NAMES.flatMap((name) => {
    const exercise = byName.get(name);
    return exercise ? [exercise] : [];
  });
  if (primary.length > 0) {
    return primary;
  }
  return inCircle.slice(0, 4);
}

export function scaledTemplateGrams(
  items: Array<{ id: string; grams: number; protein: number }>,
  targetProtein: number,
): Array<{ id: string; grams: number }> {
  if (!(targetProtein > 0) || items.length === 0) {
    return [];
  }

  const current = items.reduce((sum, item) => sum + item.protein, 0);
  if (!(current > 0)) {
    return [];
  }

  const factor = targetProtein / current;
  if (Math.abs(factor - 1) < 0.05) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    grams: clampPortion(Math.round((item.grams * factor) / 5) * 5),
  }));
}

function clampPortion(value: number): number {
  if (value < 5) {
    return 5;
  }
  if (value > 1000) {
    return 1000;
  }
  return value;
}
