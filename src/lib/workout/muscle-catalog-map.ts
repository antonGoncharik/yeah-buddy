import type { MuscleId } from "@/lib/types";

const SKIP_SECONDARY = new Set([
  "hip flexors",
  "ankles",
  "ankle stabilizers",
  "feet",
  "shins",
  "sternocleidomastoid",
  "rotator cuff",
  "grip muscles",
]);

const ISOLATION_TARGETS = new Set([
  "biceps",
  "triceps",
  "forearms",
  "calves",
  "serratus anterior",
  "levator scapulae",
]);

export function foldExerciseName(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/** ExerciseDB `target` + exercise name → app muscle id(s). */
export function mapCatalogTarget(
  target: string,
  nameFolded: string,
): MuscleId | null {
  const key = target.trim().toLowerCase();
  switch (key) {
    case "pectorals":
      return "chest";
    case "lats":
      return "lats";
    case "upper back":
      return "upper_back";
    case "traps":
      return "traps";
    case "spine":
      return "lower_back";
    case "abs":
      return "abs";
    case "serratus anterior":
      return "obliques";
    case "quads":
      return "quads";
    case "hamstrings":
      return "hamstrings";
    case "glutes":
      return "glutes";
    case "adductors":
      return "adductors";
    case "abductors":
      return "glutes";
    case "calves":
      return "calves";
    case "biceps":
      return "biceps";
    case "triceps":
      return "triceps";
    case "subscapularis":
      return "subscapularis";
    case "forearms":
      return "forearms";
    case "levator scapulae":
      return "traps";
    case "cardiovascular system":
      return null;
    case "delts":
      return mapDeltsFromName(nameFolded);
    default:
      return null;
  }
}

export function mapDeltsFromName(nameFolded: string): MuscleId {
  if (
    includesAny(nameFolded, [
      "rear",
      "reverse",
      "задн",
      "махи в наклоне",
      "rear fly",
      "face pull",
    ])
  ) {
    return "rear_delts";
  }
  if (
    includesAny(nameFolded, [
      "lateral",
      "side raise",
      "разведение",
      "в стороны",
      "upright row",
      "к подбородку",
    ])
  ) {
    return "side_delts";
  }
  return "front_delts";
}

export function mapCatalogSecondary(
  label: string,
  nameFolded: string,
): MuscleId | null {
  const key = label.trim().toLowerCase();
  if (SKIP_SECONDARY.has(key)) {
    return null;
  }
  switch (key) {
    case "shoulders":
    case "deltoids":
      return mapDeltsFromName(nameFolded);
    case "rear deltoids":
      return "rear_delts";
    case "chest":
    case "upper chest":
      return "chest";
    case "back":
    case "rhomboids":
    case "upper back":
      return "upper_back";
    case "trapezius":
    case "traps":
      return "traps";
    case "latissimus dorsi":
    case "lats":
      return "lats";
    case "quadriceps":
    case "quads":
      return "quads";
    case "hamstrings":
      return "hamstrings";
    case "glutes":
      return "glutes";
    case "calves":
    case "soleus":
      return "calves";
    case "biceps":
    case "brachialis":
      return "biceps";
    case "triceps":
      return "triceps";
    case "subscapularis":
      return "subscapularis";
    case "forearms":
    case "wrist flexors":
    case "wrist extensors":
    case "wrists":
    case "hands":
    case "grip muscles":
      return "forearms";
    case "core":
    case "abdominals":
    case "lower abs":
    case "obliques":
      return key === "obliques" ? "obliques" : "abs";
    case "lower back":
      return "lower_back";
    case "inner thighs":
    case "groin":
      return "adductors";
    default:
      return mapCatalogTarget(key, nameFolded);
  }
}

export function isIsolationCatalogTarget(target: string): boolean {
  return ISOLATION_TARGETS.has(target.trim().toLowerCase());
}

const COMPOUND_GLUTE_NAME = [
  "squat",
  "присед",
  "leg press",
  "жим ног",
  "lunge",
  "выпад",
  "step",
  "split squat",
  "hack",
  "гак",
  "sled",
];

export function applyCompoundGluteTargetFix(
  nameFolded: string,
  target: string,
  weights: Partial<Record<MuscleId, number>>,
): Partial<Record<MuscleId, number>> {
  if (target.trim().toLowerCase() !== "glutes") {
    return weights;
  }
  if (!includesAny(nameFolded, COMPOUND_GLUTE_NAME)) {
    return weights;
  }
  const next = { ...weights };
  next.glutes = Math.max(next.glutes ?? 0, 1);
  next.quads = Math.max(next.quads ?? 0, 1);
  return next;
}

export function secondaryMuscleWeight(
  muscleId: MuscleId,
  isolationTarget: boolean,
): number {
  if (muscleId === "forearms") {
    return 0.25;
  }
  if (isolationTarget) {
    return 0.25;
  }
  return 0.5;
}
