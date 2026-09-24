import { getReviewSnapshot } from "@/lib/ai/review";
import { getServerEnv } from "@/lib/env";
import { isRecord } from "@/lib/read";
import { inRetentionTail, onboardingAgeDays } from "@/lib/retention";
import { disableReminders } from "@/lib/settings";
import { dayShareFacts } from "@/lib/share/day";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDiaryMessage } from "@/lib/telegram/bot";
import {
  isoWeekdaySun0,
  localClock,
  reminderDateIfDue,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";
import {
  dateHasFoodRecord,
  dateIsTrainingDay,
  dateShareSnapshot,
  nextCircleName,
} from "@/lib/telegram/reminder-facts";
import {
  composeEveningMessage,
  reminderDayCard,
  weekRecapText,
} from "@/lib/telegram/reminder-recap";
import {
  gymClosedForReminder,
  gymDoneForReminder,
  reminderText,
} from "@/lib/telegram/reminder-text";
import { templateNamesById } from "@/lib/workout/session-names";
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
  onboardedAt: string | null;
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
    const reminderDate = reminderDateIfDue(clock);
    if (!reminderDate) {
      result.skipped += 1;
      continue;
    }
    if (candidate.remindedOn === reminderDate) {
      result.skipped += 1;
      continue;
    }

    const [foodLogged, isTrainingDay, session, nextTemplateName, snapshot] =
      await Promise.all([
        dateHasFoodRecord(candidate.userId, reminderDate),
        dateIsTrainingDay(candidate.userId, reminderDate),
        getSessionOnDate(candidate.userId, reminderDate),
        nextCircleName(candidate.userId),
        dateShareSnapshot(candidate.userId, reminderDate),
      ]);
    const sessionStatus = session?.status ?? null;
    const nag = reminderText({
      foodLogged,
      gymDone: gymDoneForReminder({
        isTrainingDay,
        sessionStatus,
      }),
      gymClosed: gymClosedForReminder(sessionStatus),
      nextTemplateName,
      early: inRetentionTail(
        onboardingAgeDays(
          candidate.onboardedAt,
          reminderDate,
          candidate.timezone,
        ),
      ),
    });
    const recap = await sundayRecap(candidate.userId, reminderDate);
    const facts = dayShareFacts({
      protein: snapshot?.protein ?? 0,
      kcal: snapshot?.kcal ?? 0,
      sessionStatus: session?.status ?? null,
      isTrainingDay,
    });
    const gymName = await completedGymName(candidate.userId, session);
    const text = composeEveningMessage(
      nag,
      recap,
      reminderDayCard({
        protein: facts.protein,
        fat: snapshot?.fat ?? 0,
        carbs: snapshot?.carbs ?? 0,
        kcal: facts.kcal,
        targetProtein: snapshot?.targetProtein ?? 0,
        targetFat: snapshot?.targetFat ?? 0,
        targetCarbs: snapshot?.targetCarbs ?? 0,
        targetKcal: snapshot?.targetKcal ?? 0,
        gym: facts.gym,
        gymName,
        nextName: facts.gym === "none" ? null : nextTemplateName,
      }),
    );
    if (!text) {
      result.skipped += 1;
      continue;
    }

    const claimed = await claimReminderDay(candidate.userId, reminderDate);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    const env = getServerEnv();
    const sent = await sendDiaryMessage(candidate.telegramId, text, env);
    if (sent === "sent") {
      result.sent += 1;
      continue;
    }

    if (sent === "blocked") {
      await disableReminders(candidate.userId);
      result.blocked += 1;
      continue;
    }

    await revertReminderDay(
      candidate.userId,
      reminderDate,
      candidate.remindedOn,
    );
    result.failed += 1;
  }

  return result;
}

async function completedGymName(
  userId: string,
  session: { status: string; template_id: string | null } | null,
): Promise<string | null> {
  if (session?.status !== "completed" || !session.template_id) {
    return null;
  }

  const names = await templateNamesById(userId, [session.template_id]);
  return names.get(session.template_id) ?? null;
}

async function sundayRecap(
  userId: string,
  reminderDate: string,
): Promise<string | null> {
  if (isoWeekdaySun0(reminderDate) !== 0) {
    return null;
  }

  try {
    const snapshot = await getReviewSnapshot(userId, 14, reminderDate);
    if (snapshot.brief.coverage === "empty") {
      return null;
    }
    return weekRecapText(snapshot.brief.signals);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function listReminderCandidates(): Promise<ReminderCandidate[]> {
  const supabase = createSupabaseServerClient();
  const candidates: ReminderCandidate[] = [];

  for (let from = 0; ; from += CANDIDATE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, reminded_on, onboarding_completed_at, users!inner(telegram_id, is_active)",
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
    onboardedAt:
      typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : null,
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
