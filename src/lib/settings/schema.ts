import { z } from "zod";

const macroGoal = z.number().finite().min(0);

const macroSettingsSchema = z.object({
  rest_protein: macroGoal,
  rest_fat: macroGoal,
  rest_carbs: macroGoal,
  training_protein: macroGoal,
  training_fat: macroGoal,
  training_carbs: macroGoal,
  reminders_enabled: z.boolean().optional(),
});

export const settingsInputSchema = z.union([
  macroSettingsSchema,
  z.object({ reminders_enabled: z.boolean() }),
  z.object({ timezone: z.string().trim().min(1).max(64) }),
  z.object({
    training_years: z.number().int().min(0).max(80).nullable(),
  }),
]);

export type SettingsInput = z.infer<typeof settingsInputSchema>;
