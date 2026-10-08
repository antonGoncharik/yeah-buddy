import { getUserSettings } from "@/lib/settings";
import { isOnboardingCompleted } from "@/lib/settings/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_TIMEZONE,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";

export type MealChatUser = {
  userId: string;
  timeZone: string;
};

export async function findMealChatUser(
  telegramId: number,
): Promise<MealChatUser | null> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .maybeSingle();

  if (found.error) {
    throw found.error;
  }

  if (!found.data) {
    return null;
  }

  const userId = String(found.data.id);
  const settings = await getUserSettings(userId);
  if (!settings || !isOnboardingCompleted(settings)) {
    return null;
  }

  return {
    userId,
    timeZone: resolveTimeZone(settings.timezone) || DEFAULT_TIMEZONE,
  };
}
