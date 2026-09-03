import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/lib/types";

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

export function mapSettings(row: Record<string, unknown>): UserSettings {
  return {
    user_id: String(row.user_id),
    rest_protein: toNumber(row.rest_protein),
    rest_fat: toNumber(row.rest_fat),
    rest_carbs: toNumber(row.rest_carbs),
    training_protein: toNumber(row.training_protein),
    training_fat: toNumber(row.training_fat),
    training_carbs: toNumber(row.training_carbs),
    updated_at: String(row.updated_at),
  };
}

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

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
