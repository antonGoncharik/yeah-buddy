import {
  toFormState,
  toPayload,
  withRecountedProtein,
} from "@/components/settings/settings-form-state";
import {
  mapSettings,
  parseStoredGoal,
  parseStoredSex,
  parseStoredTrainingAge,
} from "@/lib/settings/map";
import type { UserSettings } from "@/lib/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(parseStoredSex("male"), "male", "sex male");
assertEqual(parseStoredSex("female"), "female", "sex female");
assertEqual(parseStoredSex("other"), null, "sex unknown");
assertEqual(parseStoredSex(null), null, "sex null");
assertEqual(parseStoredGoal("keep"), "keep", "goal keep");
assertEqual(parseStoredGoal("bulk"), null, "goal unknown");
assertEqual(parseStoredTrainingAge("year"), "year", "age year");
assertEqual(parseStoredTrainingAge("pro"), null, "age unknown");

const row = {
  user_id: "u1",
  rest_protein: 120,
  rest_fat: 70,
  rest_carbs: 200,
  training_protein: 120,
  training_fat: 70,
  training_carbs: 250,
  onboarding_completed_at: null,
  reminders_enabled: true,
  timezone: "Europe/Moscow",
  training_years: null,
  sex: "male",
  goal: "keep",
  training_age: "year",
  granted_programs: [],
  updated_at: "2026-01-01",
};

const settings = mapSettings(row);
assertEqual(settings.sex, "male", "map sex");
assertEqual(settings.goal, "keep", "map goal");
assertEqual(settings.training_age, "year", "map training_age");

const form = toFormState(settings);
assertEqual(form.sex, "male", "form sex");
assertEqual(form.goal, "keep", "form goal");
assertEqual(form.training_age, "year", "form training_age");

const payload = toPayload(form);
assert(payload != null, "payload ok");
assertEqual(payload?.sex, "male", "payload sex");
assertEqual(payload?.goal, "keep", "payload goal");
assertEqual(payload?.training_age, "year", "payload training_age");

const recounted = withRecountedProtein(form, 80);
assert(recounted != null, "recount exists");
assertEqual(recounted?.rest_protein, "145", "recount protein rest");
assertEqual(recounted?.training_protein, "145", "recount protein training");
assertEqual(recounted?.rest_fat, "70", "recount fat from weight");
assertEqual(recounted?.rest_carbs, "360", "recount carbs fill kcal");
assertEqual(recounted?.training_carbs, "410", "recount training carbs");
assertEqual(recounted?.training_age, "year", "recount keeps training_age");

const noWeight: UserSettings = { ...settings, sex: null };
assertEqual(
  withRecountedProtein(toFormState(noWeight), 80),
  null,
  "no sex → no recount",
);

console.log("settings sex goal ok");
