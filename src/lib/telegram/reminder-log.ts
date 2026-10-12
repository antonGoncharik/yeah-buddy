import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReminderLogKind =
  | "evening"
  | "sunday"
  | "midday"
  | "weekly_digest"
  | "weigh_in"
  | "gym"
  | "streak"
  | "monthly_report"
  | "pr";

export async function reminderLogClaim(
  userId: string,
  kind: ReminderLogKind,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase.from("reminder_log").insert({
    user_id: userId,
    kind,
    date,
  });
  if (!inserted.error) {
    return true;
  }
  if (inserted.error.code === "23505") {
    return false;
  }
  if (isMissingReminderLog(inserted.error)) {
    return true;
  }
  throw inserted.error;
}

export async function recordReminderSent(
  userId: string,
  kind: ReminderLogKind,
  date: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const result = await supabase.from("reminder_log").upsert(
    {
      user_id: userId,
      kind,
      date,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind,date", ignoreDuplicates: true },
  );
  if (result.error && !isMissingReminderLog(result.error)) {
    throw result.error;
  }
}

function isMissingReminderLog(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "42P01" ||
    (typeof error.message === "string" &&
      error.message.includes("reminder_log"))
  );
}

export function inQuietHours(
  hour: number,
  quietFrom: number | null,
  quietTo: number | null,
): boolean {
  if (quietFrom == null || quietTo == null) {
    return false;
  }
  if (quietFrom === quietTo) {
    return false;
  }
  if (quietFrom < quietTo) {
    return hour >= quietFrom && hour < quietTo;
  }
  return hour >= quietFrom || hour < quietTo;
}
