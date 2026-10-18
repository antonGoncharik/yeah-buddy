import { KCAL_PER_BODY_KG } from "@/lib/ai/energy";
import { calcKcalFromMacros, type Macros } from "@/lib/nutrition/macros";
import {
  activityScale,
  mifflinRestKcal,
  minGoalKcal,
  referenceBodyWeightKg,
  weeklyBodyRate,
} from "@/lib/nutrition/profile-energy";
import { WEEKLY_KG_CAP } from "@/lib/nutrition/weekly-pace";
import type {
  UserActivityLevel,
  UserGoal,
  UserGoalPace,
  UserSex,
} from "@/lib/types";

export type MacroProfileInput = {
  activity_level?: UserActivityLevel | null;
  height_cm?: number | null;
  birth_year?: number | null;
  goal_pace?: UserGoalPace | null;
};

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
 * Maintenance without height and age: body weight × kcal/kg.
 * The goal and pace are applied on top, not baked into this table.
 */
const KEEP_KCAL_PER_KG: Record<OnboardingSex, number> = {
  male: 33,
  female: 30,
};

/** Extra carbs on a heavy gym day at maintenance. Cuts use less, home uses none. */
export const TRAINING_EXTRA_CARBS_G = 50;

const CARB_FLOOR_G = 80;

export type TrainingLoad = "gym" | "home" | "deload";

/** Carbs added on top of the rest day. Home and deload stay flat. */
export function trainingExtraCarbsG(input: {
  goal: OnboardingGoal;
  load?: TrainingLoad;
}): number {
  const load = input.load ?? "gym";
  if (load === "home" || load === "deload") {
    return 0;
  }
  if (input.goal === "lose") {
    return 25;
  }
  if (input.goal === "gain") {
    return 75;
  }
  return TRAINING_EXTRA_CARBS_G;
}

/** kcal/day added to maintenance so the weekly pace actually happens. */
export function dailyGoalShiftKcal(input: {
  weightKg: number;
  goal: OnboardingGoal;
  goal_pace?: UserGoalPace | null;
}): number {
  const rate = weeklyBodyRate(input.goal, input.goal_pace ?? null);
  if (rate === 0 || !(input.weightKg > 0)) {
    return 0;
  }
  // Same kg/week bounds as the later expenditure offer, so the first goal and
  // the corrected one aim at one pace.
  const cap = WEEKLY_KG_CAP[input.goal];
  const weeklyKg = Math.min(
    cap.max,
    Math.max(cap.min, Math.abs(rate) * input.weightKg),
  );
  const signed = rate < 0 ? -weeklyKg : weeklyKg;
  return Math.round((signed * KCAL_PER_BODY_KG) / 7);
}

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
  {
    id: "lose",
    label: "Сушка (похудеть)",
    hint: "Больше белка, чтобы сохранить мышцы",
  },
  {
    id: "keep",
    label: "Баланс",
    hint: "Вес стабильный — без явной сушки и набора",
  },
  {
    id: "gain",
    label: "Массонабор (набрать)",
    hint: "Больше углеводов, чтобы набрать массу",
  },
];

export function suggestProteinGrams(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
  height_cm?: number | null;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }

  const baseKg = referenceBodyWeightKg({
    sex: input.sex,
    weightKg: input.weightKg,
    height_cm: input.height_cm,
  });
  const raw = baseKg * PROTEIN_G_PER_KG[input.goal];
  return clampProtein(roundToFive(raw));
}

/** Same g/kg targets when sex is not set (no lean-share tweak). */
export function suggestProteinGramsForProfile(input: {
  sex: OnboardingSex | null;
  weightKg: number;
  goal: OnboardingGoal;
  height_cm?: number | null;
}): number | null {
  if (input.sex != null) {
    return suggestProteinGrams({
      sex: input.sex,
      weightKg: input.weightKg,
      goal: input.goal,
      height_cm: input.height_cm,
    });
  }
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }
  const raw = input.weightKg * PROTEIN_G_PER_KG[input.goal];
  return clampProtein(roundToFive(raw));
}

export function suggestFatGrams(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
  height_cm?: number | null;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }

  const baseKg = referenceBodyWeightKg({
    sex: input.sex,
    weightKg: input.weightKg,
    height_cm: input.height_cm,
  });
  const raw = baseKg * FAT_G_PER_KG[input.goal];
  return clampFat(roundToFive(raw));
}

export function suggestFatGramsForProfile(input: {
  sex: OnboardingSex | null;
  weightKg: number;
  goal: OnboardingGoal;
}): number | null {
  if (input.sex != null) {
    return suggestFatGrams({
      sex: input.sex,
      weightKg: input.weightKg,
      goal: input.goal,
    });
  }
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }
  const raw = input.weightKg * FAT_G_PER_KG[input.goal];
  return clampFat(roundToFive(raw));
}

export function suggestRestKcal(input: {
  sex: OnboardingSex;
  weightKg: number;
  goal: OnboardingGoal;
  activity_level?: UserActivityLevel | null;
  height_cm?: number | null;
  birth_year?: number | null;
  goal_pace?: UserGoalPace | null;
}): number | null {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return null;
  }
  const activity = input.activity_level ?? null;
  let maintenance: number | null = null;
  if (activity != null && input.height_cm != null && input.birth_year != null) {
    maintenance = mifflinRestKcal({
      sex: input.sex,
      weightKg: input.weightKg,
      height_cm: input.height_cm,
      birth_year: input.birth_year,
      activity,
    });
  }
  if (maintenance == null) {
    maintenance = Math.round(
      input.weightKg * KEEP_KCAL_PER_KG[input.sex] * activityScale(activity),
    );
  }
  const shifted =
    maintenance +
    dailyGoalShiftKcal({
      weightKg: input.weightKg,
      goal: input.goal,
      goal_pace: input.goal_pace,
    });
  return Math.max(minGoalKcal(input.sex), shifted);
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
  activity_level?: UserActivityLevel | null;
  height_cm?: number | null;
  birth_year?: number | null;
  goal_pace?: UserGoalPace | null;
  training_load?: TrainingLoad;
}): { protein: number; rest: Macros; training: Macros } | null {
  const suggested = suggestProteinGrams(input);
  const fat = suggestFatGrams(input);
  const restKcal = suggestRestKcal(input);
  if (suggested == null || fat == null || restKcal == null) {
    return null;
  }

  const protein =
    input.protein != null && input.protein > 0 && input.protein <= 400
      ? Math.round(input.protein)
      : suggested;

  const restCarbs = carbsForTargetKcal(restKcal, protein, fat);
  const trainingCarbs =
    restCarbs +
    trainingExtraCarbsG({
      goal: input.goal,
      load: input.training_load,
    });

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

/**
 * Split a calorie target into macros after an expenditure update.
 * Protein is re-anchored to g/kg for the current weight and goal but never
 * lowered below what the person already runs. Carbs move first; fat only steps
 * down toward the profile fat floor once carbs are on the floor.
 */
export function macroGoalsForTargetKcal(input: {
  targetKcal: number;
  weightKg: number;
  goal: OnboardingGoal;
  sex: OnboardingSex | null;
  height_cm?: number | null;
  currentProtein: number;
  currentFat: number;
  /** Stop trimming fat once kcal is within this band of the target. */
  kcalGap?: number;
}): { protein: number; fat: number; carbs: number; kcal: number } {
  const kcalGap = input.kcalGap ?? 0;
  const suggestedProtein = suggestProteinGramsForProfile({
    sex: input.sex,
    weightKg: input.weightKg,
    goal: input.goal,
    height_cm: input.height_cm,
  });
  const protein = Math.max(
    input.currentProtein,
    suggestedProtein ?? input.currentProtein,
  );

  const fatFloor =
    suggestFatGramsForProfile({
      sex: input.sex,
      weightKg: input.weightKg,
      goal: input.goal,
    }) ?? 35;

  let fat = input.currentFat;
  let carbs = carbsForTargetKcal(input.targetKcal, protein, fat);
  let kcal = calcKcalFromMacros(protein, fat, carbs);
  let guard = 0;
  while (
    kcal > input.targetKcal + kcalGap &&
    fat - 5 >= fatFloor &&
    guard < 30
  ) {
    fat -= 5;
    carbs = carbsForTargetKcal(input.targetKcal, protein, fat);
    kcal = calcKcalFromMacros(protein, fat, carbs);
    guard += 1;
  }

  return { protein, fat, carbs, kcal };
}

/** Carbs that land on `targetKcal` once protein and fat are fixed. Rounded to 5 g. */
export function carbsForTargetKcal(
  targetKcal: number,
  protein: number,
  fat: number,
): number {
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
