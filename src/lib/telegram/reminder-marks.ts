import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resetReminderDayMarks(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("user_settings")
    .update({
      reminded_on: null,
      midday_reminded_on: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updated.error) {
    throw updated.error;
  }
}
