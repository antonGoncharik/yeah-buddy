import { z } from "zod";

const macroGoal = z.number().finite().min(0);
const dismissedKcal = z.number().int().min(0).max(20_000).nullable();

const sex = z.enum(["male", "female"]).nullable();
const goal = z.enum(["lose", "keep", "gain"]).nullable();
const trainingAge = z.enum(["beginner", "year", "years"]).nullable();

const macroSettingsSchema = z.object({
  rest_protein: macroGoal,
  rest_fat: macroGoal,
  rest_carbs: macroGoal,
  training_protein: macroGoal,
  training_fat: macroGoal,
  training_carbs: macroGoal,
  reminders_enabled: z.boolean().optional(),
  sex: sex.optional(),
  goal: goal.optional(),
  training_age: trainingAge.optional(),
  energy_goal_dismissed_kcal: dismissedKcal.optional(),
});

export const settingsInputSchema = z.union([
  macroSettingsSchema,
  z.object({ reminders_enabled: z.boolean() }),
  z.object({ timezone: z.string().trim().min(1).max(64) }),
  z.object({ sex }),
  z.object({ goal }),
  z.object({ training_age: trainingAge }),
  z.object({ meal_template_fill_prompt_dismissed: z.boolean() }),
  z.object({ energy_goal_dismissed_kcal: dismissedKcal }),
  z
    .object({
      sex: sex.optional(),
      goal: goal.optional(),
      training_age: trainingAge.optional(),
    })
    .refine(
      (value) =>
        value.sex !== undefined ||
        value.goal !== undefined ||
        value.training_age !== undefined,
      { message: "Нужно хотя бы одно поле профиля" },
    ),
]);

export type SettingsInput = z.infer<typeof settingsInputSchema>;
