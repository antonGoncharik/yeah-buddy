import { disableReminders } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** After this many consecutive failures, reminders are turned off for the user. */
export const REMINDER_FAIL_PAUSE_THRESHOLD = 5;

export function reminderSendPaused(failCount: number): boolean {
  return failCount >= REMINDER_FAIL_PAUSE_THRESHOLD;
}

export async function resetReminderFailCount(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("user_settings")
    .update({ reminder_fail_count: 0 })
    .eq("user_id", userId);
  if (result.error) {
    throw result.error;
  }
}

export async function recordReminderSendFailure(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const current = await supabase
    .from("user_settings")
    .select("reminder_fail_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (current.error) {
    throw current.error;
  }
  const next = Math.min(
    32767,
    (Number(current.data?.reminder_fail_count) || 0) + 1,
  );
  const updated = await supabase
    .from("user_settings")
    .update({ reminder_fail_count: next })
    .eq("user_id", userId);
  if (updated.error) {
    throw updated.error;
  }
  if (next >= REMINDER_FAIL_PAUSE_THRESHOLD) {
    await disableReminders(userId);
  }
}
