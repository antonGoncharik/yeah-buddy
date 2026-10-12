import {
  calcKcalFromMacros,
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import {
  ageInputFromBirthYear,
  parseAgeInput,
  parseHeightInput,
} from "@/lib/nutrition/body-profile";
import { readSettingsPayload } from "@/lib/settings/map";
import type {
  UserActivityLevel,
  UserGoalPace,
  UserSettings,
  UserTrainingAge,
} from "@/lib/types";

export interface SettingsFormState {
  rest_protein: string;
  rest_fat: string;
  rest_carbs: string;
  training_protein: string;
  training_fat: string;
  training_carbs: string;
  reminders_enabled: boolean;
  timezone: string;
  sex: OnboardingSex | null;
  goal: OnboardingGoal | null;
  training_age: UserTrainingAge | null;
  activity_level: UserActivityLevel | null;
  goal_pace: UserGoalPace | null;
  height_cm: string;
  age: string;
  reminder_hour: number;
  gym_enabled: boolean;
  weekly_digest_enabled: boolean;
  monthly_report_enabled: boolean;
  pr_push_enabled: boolean;
  weigh_in_enabled: boolean;
  streak_reminder_enabled: boolean;
  quiet_from: number | null;
  quiet_to: number | null;
}

export type MacroFieldKey = Exclude<
  keyof SettingsFormState,
  | "reminders_enabled"
  | "timezone"
  | "sex"
  | "goal"
  | "training_age"
  | "activity_level"
  | "goal_pace"
  | "reminder_hour"
  | "gym_enabled"
  | "weekly_digest_enabled"
  | "monthly_report_enabled"
  | "pr_push_enabled"
  | "weigh_in_enabled"
  | "streak_reminder_enabled"
  | "quiet_from"
  | "quiet_to"
>;

export function toFormState(
  settings: UserSettings,
  nowYear = new Date().getFullYear(),
): SettingsFormState {
  return {
    rest_protein: String(settings.rest_protein),
    rest_fat: String(settings.rest_fat),
    rest_carbs: String(settings.rest_carbs),
    training_protein: String(settings.training_protein),
    training_fat: String(settings.training_fat),
    training_carbs: String(settings.training_carbs),
    reminders_enabled: settings.reminders_enabled,
    timezone: settings.timezone,
    sex: settings.sex,
    goal: settings.goal,
    training_age: settings.training_age,
    activity_level: settings.activity_level,
    goal_pace: settings.goal_pace,
    height_cm: settings.height_cm != null ? String(settings.height_cm) : "",
    age: ageInputFromBirthYear(settings.birth_year, nowYear),
    reminder_hour: settings.reminder_hour,
    gym_enabled: settings.gym_enabled,
    weekly_digest_enabled: settings.weekly_digest_enabled,
    monthly_report_enabled: settings.monthly_report_enabled,
    pr_push_enabled: settings.pr_push_enabled,
    weigh_in_enabled: settings.weigh_in_enabled,
    streak_reminder_enabled: settings.streak_reminder_enabled,
    quiet_from: settings.quiet_from,
    quiet_to: settings.quiet_to,
  };
}

export function toPayload(
  form: SettingsFormState,
  nowYear = new Date().getFullYear(),
) {
  const rest_protein = parseMacro(form.rest_protein);
  const rest_fat = parseMacro(form.rest_fat);
  const rest_carbs = parseMacro(form.rest_carbs);
  const training_protein = parseMacro(form.training_protein);
  const training_fat = parseMacro(form.training_fat);
  const training_carbs = parseMacro(form.training_carbs);

  if (
    rest_protein == null ||
    rest_fat == null ||
    rest_carbs == null ||
    training_protein == null ||
    training_fat == null ||
    training_carbs == null
  ) {
    return null;
  }

  const height = parseHeightInput(form.height_cm);
  const birth = parseAgeInput(form.age, nowYear);
  if (!height.ok || !birth.ok) {
    return null;
  }

  return {
    rest_protein,
    rest_fat,
    rest_carbs,
    training_protein,
    training_fat,
    training_carbs,
    sex: form.sex,
    goal: form.goal,
    training_age: form.training_age,
    activity_level: form.activity_level,
    goal_pace: form.goal_pace,
    height_cm: height.cm,
    birth_year: birth.year,
  };
}

export function parseMacro(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

export function kcalFromFields(
  proteinRaw: string | undefined,
  fatRaw: string | undefined,
  carbsRaw: string | undefined,
): number | null {
  if (proteinRaw == null || fatRaw == null || carbsRaw == null) {
    return null;
  }

  const protein = parseMacro(proteinRaw);
  const fat = parseMacro(fatRaw);
  const carbs = parseMacro(carbsRaw);
  if (protein == null || fat == null || carbs == null) {
    return null;
  }

  return calcKcalFromMacros(protein, fat, carbs);
}

/** Recount protein, fat and carbs from sex, goal and body weight. */
export function withRecountedProtein(
  form: SettingsFormState,
  weightKg: number,
  nowYear = new Date().getFullYear(),
): SettingsFormState | null {
  if (form.sex == null || form.goal == null) {
    return null;
  }

  const height = parseHeightInput(form.height_cm);
  const birth = parseAgeInput(form.age, nowYear);
  const goals = suggestMacroGoals({
    sex: form.sex,
    weightKg,
    goal: form.goal,
    activity_level: form.activity_level,
    height_cm: height.ok ? height.cm : null,
    birth_year: birth.ok ? birth.year : null,
    goal_pace: form.goal === "keep" ? null : form.goal_pace,
  });
  if (goals == null) {
    return null;
  }

  return {
    ...form,
    rest_protein: String(goals.rest.protein),
    rest_fat: String(goals.rest.fat),
    rest_carbs: String(goals.rest.carbs),
    training_protein: String(goals.training.protein),
    training_fat: String(goals.training.fat),
    training_carbs: String(goals.training.carbs),
  };
}

export function readSettings(data: unknown): UserSettings | null {
  return readSettingsPayload(data);
}
