import {
  calcKcalFromMacros,
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings/map";
import type { UserSettings, UserTrainingAge } from "@/lib/types";

export interface SettingsFormState {
  rest_protein: string;
  rest_fat: string;
  rest_carbs: string;
  training_protein: string;
  training_fat: string;
  training_carbs: string;
  reminders_enabled: boolean;
  timezone: string;
  training_years: string;
  sex: OnboardingSex | null;
  goal: OnboardingGoal | null;
  training_age: UserTrainingAge | null;
}

export type MacroFieldKey = Exclude<
  keyof SettingsFormState,
  | "reminders_enabled"
  | "timezone"
  | "training_years"
  | "sex"
  | "goal"
  | "training_age"
>;

export function toFormState(settings: UserSettings): SettingsFormState {
  return {
    rest_protein: String(settings.rest_protein),
    rest_fat: String(settings.rest_fat),
    rest_carbs: String(settings.rest_carbs),
    training_protein: String(settings.training_protein),
    training_fat: String(settings.training_fat),
    training_carbs: String(settings.training_carbs),
    reminders_enabled: settings.reminders_enabled,
    timezone: settings.timezone,
    training_years:
      settings.training_years == null ? "" : String(settings.training_years),
    sex: settings.sex,
    goal: settings.goal,
    training_age: settings.training_age,
  };
}

export function parseTrainingYearsInput(
  raw: string,
): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  if (!/^\d{1,2}$/.test(trimmed)) {
    return undefined;
  }

  const value = Number(trimmed);
  if (value > 80) {
    return undefined;
  }

  return value;
}

export function toPayload(form: SettingsFormState) {
  const rest_protein = parseMacro(form.rest_protein);
  const rest_fat = parseMacro(form.rest_fat);
  const rest_carbs = parseMacro(form.rest_carbs);
  const training_protein = parseMacro(form.training_protein);
  const training_fat = parseMacro(form.training_fat);
  const training_carbs = parseMacro(form.training_carbs);

  const training_years = parseTrainingYearsInput(form.training_years);
  if (
    rest_protein == null ||
    rest_fat == null ||
    rest_carbs == null ||
    training_protein == null ||
    training_fat == null ||
    training_carbs == null ||
    training_years === undefined
  ) {
    return null;
  }

  return {
    rest_protein,
    rest_fat,
    rest_carbs,
    training_protein,
    training_fat,
    training_carbs,
    training_years,
    sex: form.sex,
    goal: form.goal,
    training_age: form.training_age,
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
): SettingsFormState | null {
  if (form.sex == null || form.goal == null) {
    return null;
  }

  const goals = suggestMacroGoals({
    sex: form.sex,
    weightKg,
    goal: form.goal,
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
