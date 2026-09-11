import { mapSettings } from "@/lib/settings/map";
import type { SettingsInput } from "@/lib/settings/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/lib/types";

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

export async function saveUserTimezone(
  userId: string,
  timezone: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("user_settings")
    .update({ timezone, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (saved.error) {
    throw saved.error;
  }
}

export async function disableReminders(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("user_settings")
    .update({
      reminders_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (saved.error) {
    throw saved.error;
  }
}
