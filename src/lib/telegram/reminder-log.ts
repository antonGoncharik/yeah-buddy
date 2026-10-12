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

export const REMINDER_EXTRA_DAILY_CAP = 2;

const REMINDER_EXTRA_KINDS = [
  "weekly_digest",
  "weigh_in",
  "gym",
  "streak",
  "monthly_report",
  "pr",
] as const satisfies readonly ReminderLogKind[];

export function isReminderExtraKind(kind: ReminderLogKind): boolean {
  return (REMINDER_EXTRA_KINDS as readonly string[]).includes(kind);
}

export function reminderExtraBlocked(sent: number): boolean {
  return sent >= REMINDER_EXTRA_DAILY_CAP;
}

export async function reminderExtraSentCount(
  userId: string,
  date: string,
): Promise<number> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("reminder_log")
    .select("kind", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", date)
    .in("kind", [...REMINDER_EXTRA_KINDS]);
  if (result.error) {
    if (isMissingReminderLog(result.error)) {
      return 0;
    }
    throw result.error;
  }
  return result.count ?? 0;
}

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

export async function reminderLogRelease(
  userId: string,
  kind: ReminderLogKind,
  date: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("reminder_log")
    .delete()
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("date", date);
  if (deleted.error && !isMissingReminderLog(deleted.error)) {
    throw deleted.error;
  }
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
