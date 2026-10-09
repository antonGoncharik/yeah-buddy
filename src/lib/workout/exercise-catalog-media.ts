import {
  EXERCISE_CATALOG_GITHUB_REF,
  EXERCISE_CATALOG_GITHUB_REPO,
} from "@/lib/workout/exercise-catalog-constants";

function catalogRawBase(): string {
  return `https://cdn.jsdelivr.net/gh/${EXERCISE_CATALOG_GITHUB_REPO}@${EXERCISE_CATALOG_GITHUB_REF}`;
}

export function catalogExerciseGifUrl(gifPath: string): string {
  const normalized = gifPath.replace(/^\//, "");
  return `${catalogRawBase()}/${normalized}`;
}

export function catalogExerciseImageUrl(imagePath: string): string {
  const normalized = imagePath.replace(/^\//, "");
  return `${catalogRawBase()}/${normalized}`;
}
