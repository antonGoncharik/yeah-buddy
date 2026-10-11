import type {
  UserActivityLevel,
  UserGoal,
  UserGoalPace,
  UserSex,
} from "@/lib/types";

export const ACTIVITY_FACTOR: Record<UserActivityLevel, number> = {
  low: 1.35,
  moderate: 1.5,
  high: 1.7,
};

/** Midpoint of the legacy kcal/kg table — scale other activity levels from it. */
export const BASE_ACTIVITY_FACTOR = 1.45;

export const ONBOARDING_ACTIVITY_OPTIONS: Array<{
  id: UserActivityLevel;
  label: string;
  hint: string;
}> = [
  { id: "low", label: "Мало двигаюсь", hint: "Офис, мало шагов" },
  { id: "moderate", label: "Обычно", hint: "Гуляю, бытовая активность" },
  {
    id: "high",
    label: "Много на ногах",
    hint: "Физическая работа или 12k+ шагов",
  },
];

export const ONBOARDING_PACE_OPTIONS: Array<{
  id: UserGoalPace;
  label: string;
  hint: string;
}> = [
  { id: "slow", label: "Плавно", hint: "≈0,25% веса в неделю" },
  { id: "normal", label: "Обычно", hint: "≈0,5% веса в неделю" },
  { id: "fast", label: "Быстрее", hint: "≈0,75% веса в неделю" },
];

const PACE_LOSE_RATE: Record<UserGoalPace, number> = {
  slow: -0.0025,
  normal: -0.005,
  fast: -0.0075,
};

const PACE_GAIN_RATE: Record<UserGoalPace, number> = {
  slow: 0.0012,
  normal: 0.0025,
  fast: 0.0035,
};

export function referenceBodyWeightKg(input: {
  sex: UserSex;
  weightKg: number;
  height_cm?: number | null;
}): number {
  if (input.height_cm != null && input.height_cm >= 120) {
    const heightM = input.height_cm / 100;
    const bmiCapKg = 27 * heightM * heightM;
    return Math.min(input.weightKg, bmiCapKg);
  }
  const cap = input.sex === "female" ? 85 : 100;
  return Math.min(input.weightKg, cap);
}

export function activityScale(activity: UserActivityLevel | null): number {
  if (activity == null) {
    return 1;
  }
  return ACTIVITY_FACTOR[activity] / BASE_ACTIVITY_FACTOR;
}

export function ageFromBirthYear(
  birthYear: number | null,
  nowYear: number,
): number | null {
  if (birthYear == null || birthYear < 1940 || birthYear > nowYear - 10) {
    return null;
  }
  return nowYear - birthYear;
}

/** Mifflin–St Jeor BMR × activity factor. */
export function mifflinRestKcal(input: {
  sex: UserSex;
  weightKg: number;
  height_cm: number;
  birth_year: number;
  activity: UserActivityLevel;
  nowYear?: number;
}): number | null {
  const age = ageFromBirthYear(input.birth_year, input.nowYear ?? 2026);
  if (age == null || input.weightKg < 30 || input.height_cm < 120) {
    return null;
  }
  const s = input.sex === "male" ? 5 : -161;
  const bmr = 10 * input.weightKg + 6.25 * input.height_cm - 5 * age + s;
  if (!Number.isFinite(bmr) || bmr < 800) {
    return null;
  }
  return Math.round(bmr * ACTIVITY_FACTOR[input.activity]);
}

export function minGoalKcal(sex: UserSex): number {
  return sex === "male" ? 1500 : 1200;
}

export function weeklyBodyRate(
  goal: UserGoal,
  pace: UserGoalPace | null,
): number {
  if (goal === "keep") {
    return 0;
  }
  const p = pace ?? "normal";
  if (goal === "lose") {
    return PACE_LOSE_RATE[p];
  }
  return PACE_GAIN_RATE[p];
}

/** Percent of body weight per week, for the pace buttons. */
export function paceHint(goal: UserGoal, pace: UserGoalPace): string {
  if (goal === "keep") {
    return "вес держим";
  }
  const percent = Math.abs(weeklyBodyRate(goal, pace)) * 100;
  const digits = percent >= 0.1 ? 2 : 1;
  const shown = percent.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return goal === "lose"
    ? `около ${shown}% веса в неделю вниз`
    : `около ${shown}% веса в неделю вверх`;
}
