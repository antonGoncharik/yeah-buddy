import { isRecord } from "@/lib/read";
import { disableReminders } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDiaryMessage } from "@/lib/telegram/bot";
import {
  isReminderHour,
  localClock,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";
import {
  dateHasFoodRecord,
  nextCircleName,
} from "@/lib/telegram/reminder-facts";
import { reminderText } from "@/lib/telegram/reminder-text";
import { getSessionOnDate } from "@/lib/workout/sessions";

const CANDIDATE_PAGE = 100;

export interface ReminderRunResult {
  sent: number;
  skipped: number;
  blocked: number;
  failed: number;
}

interface ReminderCandidate {
  userId: string;
  telegramId: number;
  timezone: string;
  remindedOn: string | null;
}

export async function runEveningReminders(
  now = new Date(),
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    sent: 0,
    skipped: 0,
    blocked: 0,
    failed: 0,
  };

  for (const candidate of await listReminderCandidates()) {
    const clock = localClock(now, candidate.timezone);
    if (!isReminderHour(clock.hour) || candidate.remindedOn === clock.date) {
      result.skipped += 1;
      continue;
    }

    const text = reminderText({
      foodLogged: await dateHasFoodRecord(candidate.userId, clock.date),
      gymLogged: (await getSessionOnDate(candidate.userId, clock.date)) != null,
      nextTemplateName: await nextCircleName(candidate.userId),
    });
    if (!text) {
      result.skipped += 1;
      continue;
    }

    const claimed = await claimReminderDay(candidate.userId, clock.date);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    const sent = await sendDiaryMessage(candidate.telegramId, text);
    if (sent === "sent") {
      result.sent += 1;
      continue;
    }

    if (sent === "blocked") {
      await disableReminders(candidate.userId);
      result.blocked += 1;
      continue;
    }

    await revertReminderDay(candidate.userId, clock.date, candidate.remindedOn);
    result.failed += 1;
  }

  return result;
}

async function listReminderCandidates(): Promise<ReminderCandidate[]> {
  const supabase = createSupabaseServerClient();
  const candidates: ReminderCandidate[] = [];

  for (let from = 0; ; from += CANDIDATE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, reminded_on, users!inner(telegram_id, is_active)",
      )
      .eq("reminders_enabled", true)
      .not("onboarding_completed_at", "is", null)
      .eq("users.is_active", true)
      .gt("users.telegram_id", 0)
      .order("user_id", { ascending: true })
      .range(from, from + CANDIDATE_PAGE - 1);

    if (page.error) {
      throw page.error;
    }

    const rows = page.data ?? [];
    for (const row of rows) {
      const mapped = mapCandidate(row as Record<string, unknown>);
      if (mapped) {
        candidates.push(mapped);
      }
    }

    if (rows.length < CANDIDATE_PAGE) {
      break;
    }
  }

  return candidates;
}

function mapCandidate(row: Record<string, unknown>): ReminderCandidate | null {
  if (typeof row.user_id !== "string") {
    return null;
  }

  const userRaw = row.users;
  const user = Array.isArray(userRaw)
    ? isRecord(userRaw[0])
      ? userRaw[0]
      : null
    : isRecord(userRaw)
      ? userRaw
      : null;
  if (user?.is_active === false) {
    return null;
  }

  const telegramId = Number(user?.telegram_id);
  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    return null;
  }

  return {
    userId: row.user_id,
    telegramId,
    timezone: resolveTimeZone(
      typeof row.timezone === "string" ? row.timezone : null,
    ),
    remindedOn: toDateOnly(row.reminded_on),
  };
}

function toDateOnly(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

async function claimReminderDay(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const claimed = await supabase
    .from("user_settings")
    .update({
      reminded_on: date,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .or(`reminded_on.is.null,reminded_on.neq.${date}`)
    .select("user_id");

  if (claimed.error) {
    throw claimed.error;
  }

  return (claimed.data?.length ?? 0) > 0;
}

async function revertReminderDay(
  userId: string,
  date: string,
  previous: string | null,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const reverted = await supabase
    .from("user_settings")
    .update({
      reminded_on: previous,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("reminded_on", date);

  if (reverted.error) {
    throw reverted.error;
  }
}
