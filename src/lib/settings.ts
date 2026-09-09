import { z } from "zod";

import { mapSettings } from "@/lib/settings-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/lib/types";

export { isOnboardingCompleted, mapSettings } from "@/lib/settings-map";

const macroGoal = z.number().finite().min(0);

export const settingsInputSchema = z.object({
  rest_protein: macroGoal,
  rest_fat: macroGoal,
  rest_carbs: macroGoal,
  training_protein: macroGoal,
  training_fat: macroGoal,
  training_carbs: macroGoal,
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapSettings(result.data as Record<string, unknown>);
}

export async function saveUserSettings(
  userId: string,
  input: SettingsInput,
): Promise<UserSettings> {
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...input,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Settings save failed");
  }

  return mapSettings(saved.data as Record<string, unknown>);
}
