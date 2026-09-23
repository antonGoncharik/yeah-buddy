import { calcKcalFromMacros, type Macros } from "@/lib/nutrition/macros";
import type { UserGoal, UserSex } from "@/lib/types";

export type OnboardingSex = UserSex;
export type OnboardingGoal = UserGoal;

export function isOnboardingSex(value: unknown): value is OnboardingSex {
  return value === "male" || value === "female";
}

export function isOnboardingGoal(value: unknown): value is OnboardingGoal {
  return value === "lose" || value === "keep" || value === "gain";
}

/** Grams of protein per kg of body weight. */
const PROTEIN_G_PER_KG: Record<OnboardingGoal, number> = {
  lose: 2,
  keep: 1.8,
  gain: 1.6,
};

/** Fat grams per kg — soft floor so hormones and satiety stay covered. */
const FAT_G_PER_KG: Record<OnboardingGoal, number> = {
  lose: 0.8,
  keep: 0.9,
  gain: 1,
};

/**
 * Rough daily energy without height/age: bodyweight × kcal/kg.
 * Between sedentary and lightly active — enough for a diary start.
 */
const KCAL_PER_KG: Record<
  OnboardingSex,
  Record<OnboardingGoal, number>
> = {
  male: { lose: 28, keep: 33, gain: 38 },
  female: { lose: 25, keep: 30, gain: 35 },
};

/** Extra carbs on a training day (≈ +200 kcal), same gap as the old defaults. */
const TRAINING_EXTRA_CARBS_G = 50;

const CARB_FLOOR_G = 80;

/** Rough lean-mass share — same scale for both sexes keeps g/kg honest. */
const LEAN_SHARE: Record<OnboardingSex, number> = {
  male: 1,
  female: 0.9,
};

export const ONBOARDING_SEX_OPTIONS: Array<{
  id: OnboardingSex;
  label: string;
}> = [
  { id: "male", label: "Мужчина" },
  { id: "female", label: "Женщина" },
];

export const ONBOARDING_GOAL_OPTIONS: Array<{
  id: OnboardingGoal;
  label: string;
  hint: string;
}> = [
  { id: "lose", label: "Похудеть", hint: "Больше белка, чтобы сохранить мышцы" },
  { id: "keep", label: "Держать", hint: "Обычный ориентир" },
  { id: "gain", label: "Набрать", hint: "Белка хватает, остальное — еда" },
];

export function suggestProteinGrams(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }

  const raw =
    input.weightKg *
    PROTEIN_G_PER_KG[input.goal] *
    LEAN_SHARE[input.sex];
  return clampProtein(roundToFive(raw));
}

export function suggestFatGrams(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }

  const raw =
    input.weightKg * FAT_G_PER_KG[input.goal] * LEAN_SHARE[input.sex];
  return clampFat(roundToFive(raw));
}

export function suggestRestKcal(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }
  return Math.round(input.weightKg * KCAL_PER_KG[input.sex][input.goal]);
}

/**
 * Protein, fat and carbs for rest and training days from sex, weight and goal.
 * Optional `protein` keeps a custom protein and still fills fat/carbs from the
 * calorie target.
 */
export function suggestMacroGoals(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
  protein?: number | null;
}): { protein: number; rest: Macros; training: Macros } | null {
  const suggested = suggestProteinGrams(input);
  const fat = suggestFatGrams(input);
  const restKcal = suggestRestKcal(input);
  if (suggested == null || fat == null || restKcal == null) {
    return null;
  }

  const protein =
    input.protein != null &&
    input.protein > 0 &&
    input.protein <= 400
      ? Math.round(input.protein)
      : suggested;

  const restCarbs = carbsToFill(restKcal, protein, fat);
  const trainingCarbs = restCarbs + TRAINING_EXTRA_CARBS_G;

  return {
    protein,
    rest: {
      protein,
      fat,
      carbs: restCarbs,
      kcal: calcKcalFromMacros(protein, fat, restCarbs),
    },
    training: {
      protein,
      fat,
      carbs: trainingCarbs,
      kcal: calcKcalFromMacros(protein, fat, trainingCarbs),
    },
  };
}

function carbsToFill(targetKcal: number, protein: number, fat: number): number {
  const remaining = targetKcal - protein * 4 - fat * 9;
  if (remaining < CARB_FLOOR_G * 4) {
    return CARB_FLOOR_G;
  }
  return clampCarbs(roundToFive(remaining / 4));
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function clampProtein(value: number): number {
  if (value < 60) {
    return 60;
  }
  if (value > 250) {
    return 250;
  }
  return value;
}

function clampFat(value: number): number {
  if (value < 35) {
    return 35;
  }
  if (value > 150) {
    return 150;
  }
  return value;
}

function clampCarbs(value: number): number {
  if (value < CARB_FLOOR_G) {
    return CARB_FLOOR_G;
  }
  if (value > 500) {
    return 500;
  }
  return value;
}
