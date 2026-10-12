import { getReviewSnapshot } from "@/lib/ai/review";
import { trackEvent } from "@/lib/analytics/track";
import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import { getServerEnv } from "@/lib/env";
import { isRecord } from "@/lib/read";
import {
  inEarlyHabitWindow,
  inRetentionTail,
  onboardingAgeDays,
} from "@/lib/retention";
import { disableReminders } from "@/lib/settings";
import { dayShareFacts } from "@/lib/share/day";
import { renderShareCardJpeg } from "@/lib/share/share-card-jpeg";
import type { SundayCard } from "@/lib/share/sunday-card";
import {
  encodeSundayCard,
  sundayCardCaption,
  sundayCardFromBrief,
} from "@/lib/share/sunday-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type DiarySendResult,
  sendDiaryCardJpeg,
  sendDiaryMessage,
} from "@/lib/telegram/bot";
import {
  eveningReminderDateForCandidate,
  isoWeekdaySun0,
  localClock,
  middayReminderDateIfDue,
  normalizeReminderHour,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";
import {
  type EveningReminderFacts,
  loadEveningReminderFactsBatch,
} from "@/lib/telegram/reminder-evening-batch";
import {
  dateHasFoodRecord,
  dateIsTrainingDay,
  datePriorFoodLogDays,
  dateShareSnapshot,
  nextCircleName,
} from "@/lib/telegram/reminder-facts";
import {
  recordReminderSendFailure,
  reminderSendPaused,
  resetReminderFailCount,
} from "@/lib/telegram/reminder-fail-count";
import { middayReminderText } from "@/lib/telegram/reminder-midday";
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
import {
  eveningDueTimezoneKeys,
  middayDueTimezoneKeys,
} from "@/lib/telegram/reminder-timezones";
import { templateNamesById } from "@/lib/workout/session-names";
import { getSessionOnDate } from "@/lib/workout/sessions";

const CANDIDATE_PAGE = 100;
const REMINDER_CONCURRENCY = 5;

function mergeRunResult(
  into: ReminderRunResult,
  part: ReminderRunResult,
): void {
  into.sent += part.sent;
  into.skipped += part.skipped;
  into.blocked += part.blocked;
  into.failed += part.failed;
}

function emptyRunResult(): ReminderRunResult {
  return { sent: 0, skipped: 0, blocked: 0, failed: 0 };
}

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
  reminderHour: number;
  remindedOn: string | null;
  middayRemindedOn: string | null;
  onboardedAt: string | null;
  reminderFailCount: number;
}

export interface RemindersCronResult {
  evening: ReminderRunResult;
  midday: ReminderRunResult;
}

export type ReminderCronShard = {
  index: number;
  total: number;
};

export async function runRemindersCron(
  now = new Date(),
  shard?: ReminderCronShard,
): Promise<RemindersCronResult> {
  return {
    evening: await runEveningReminders(now, shard),
    midday: await runMiddayReminders(now, shard),
  };
}

export function reminderShardTotalFromEnv(): number {
  const raw = process.env.REMINDER_SHARD_TOTAL?.trim();
  if (!raw) {
    return 1;
  }
  const total = Number(raw);
  if (!Number.isInteger(total) || total < 1 || total > 8) {
    return 1;
  }
  return total;
}

/** Runs all env-configured shards in one cron invocation when no ?shard= is set. */
export async function runRemindersCronAll(
  now = new Date(),
  explicitShard?: ReminderCronShard,
): Promise<RemindersCronResult> {
  if (explicitShard) {
    return runRemindersCron(now, explicitShard);
  }
  const total = reminderShardTotalFromEnv();
  if (total <= 1) {
    return runRemindersCron(now);
  }
  const merged: RemindersCronResult = {
    evening: emptyRunResult(),
    midday: emptyRunResult(),
  };
  for (let index = 0; index < total; index += 1) {
    const part = await runRemindersCron(now, { index, total });
    mergeRunResult(merged.evening, part.evening);
    mergeRunResult(merged.midday, part.midday);
  }
  return merged;
}

function candidateInShard(userId: string, shard?: ReminderCronShard): boolean {
  if (!shard || shard.total <= 1) {
    return true;
  }
  if (shard.index < 0 || shard.index >= shard.total) {
    return false;
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % shard.total === shard.index;
}

export async function runEveningReminders(
  now = new Date(),
  shard?: ReminderCronShard,
): Promise<ReminderRunResult> {
  const result = emptyRunResult();
  const distinct = await listDistinctReminderTimezones();
  const dueTimezones = eveningDueTimezoneKeys(distinct, now);
  if (dueTimezones.length === 0) {
    return result;
  }

  const candidates = (await listReminderCandidates(dueTimezones)).filter(
    (candidate) => candidateInShard(candidate.userId, shard),
  );

  const batchInputs: Array<{ userId: string; date: string }> = [];
  for (const candidate of candidates) {
    const clock = localClock(now, candidate.timezone);
    const reminderDate = eveningReminderDateForCandidate(
      clock,
      candidate.remindedOn,
      candidate.reminderHour,
    );
    if (!reminderDate || candidate.remindedOn === reminderDate) {
      continue;
    }
    batchInputs.push({ userId: candidate.userId, date: reminderDate });
  }
  const factsMap = await loadEveningReminderFactsBatch(batchInputs);

  const parts: ReminderRunResult[] = [];
  await mapWithConcurrency(
    candidates,
    REMINDER_CONCURRENCY,
    async (candidate) => {
      const clock = localClock(now, candidate.timezone);
      const reminderDate = eveningReminderDateForCandidate(
        clock,
        candidate.remindedOn,
        candidate.reminderHour,
      );
      const preloaded =
        reminderDate != null
          ? factsMap.get(`${candidate.userId}:${reminderDate}`)
          : undefined;
      parts.push(await processEveningCandidate(candidate, now, preloaded));
    },
  );
  for (const part of parts) {
    mergeRunResult(result, part);
  }

  return result;
}

async function processEveningCandidate(
  candidate: ReminderCandidate,
  now: Date,
  preloaded?: EveningReminderFacts,
): Promise<ReminderRunResult> {
  const result = emptyRunResult();
  if (reminderSendPaused(candidate.reminderFailCount)) {
    result.skipped += 1;
    return result;
  }
  const clock = localClock(now, candidate.timezone);
  const reminderDate = eveningReminderDateForCandidate(
    clock,
    candidate.remindedOn,
    candidate.reminderHour,
  );
  if (!reminderDate) {
    result.skipped += 1;
    return result;
  }
  if (candidate.remindedOn === reminderDate) {
    result.skipped += 1;
    return result;
  }

  const [foodLogged, isTrainingDay, session, nextTemplateName, snapshot] =
    preloaded
      ? [
          preloaded.foodLogged,
          preloaded.isTrainingDay,
          preloaded.session,
          preloaded.nextTemplateName,
          preloaded.snapshot,
        ]
      : await Promise.all([
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
  const sunday = await sundayPack(candidate.userId, reminderDate);
  const recap = sunday.recap;
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
    return result;
  }

  const claimed = await claimReminderDay(candidate.userId, reminderDate);
  if (!claimed) {
    result.skipped += 1;
    return result;
  }

  const env = getServerEnv();
  const sent = await sendEvening(candidate.telegramId, text, sunday.query, env);
  if (sent === "sent") {
    result.sent += 1;
    await resetReminderFailCount(candidate.userId);
    await trackEvent(candidate.userId, "reminder_sent", {
      kind: sunday.query ? "sunday" : "evening",
    });
    return result;
  }

  if (sent === "blocked") {
    await disableReminders(candidate.userId);
    result.blocked += 1;
    await trackEvent(candidate.userId, "reminder_blocked", {
      kind: sunday.query ? "sunday" : "evening",
    });
    return result;
  }

  await revertReminderDay(candidate.userId, reminderDate, candidate.remindedOn);
  await recordReminderSendFailure(candidate.userId);
  result.failed += 1;
  return result;
}

export async function runMiddayReminders(
  now = new Date(),
  shard?: ReminderCronShard,
): Promise<ReminderRunResult> {
  const result = emptyRunResult();
  const distinct = await listDistinctReminderTimezones();
  const dueTimezones = middayDueTimezoneKeys(distinct, now);
  if (dueTimezones.length === 0) {
    return result;
  }

  const candidates = (await listReminderCandidates(dueTimezones)).filter(
    (candidate) => candidateInShard(candidate.userId, shard),
  );
  const parts: ReminderRunResult[] = [];
  await mapWithConcurrency(
    candidates,
    REMINDER_CONCURRENCY,
    async (candidate) => {
      parts.push(await processMiddayCandidate(candidate, now));
    },
  );
  for (const part of parts) {
    mergeRunResult(result, part);
  }

  return result;
}

async function processMiddayCandidate(
  candidate: ReminderCandidate,
  now: Date,
): Promise<ReminderRunResult> {
  const result = emptyRunResult();
  if (reminderSendPaused(candidate.reminderFailCount)) {
    result.skipped += 1;
    return result;
  }
  const clock = localClock(now, candidate.timezone);
  const reminderDate = middayReminderDateIfDue(clock, candidate.reminderHour);
  if (!reminderDate) {
    result.skipped += 1;
    return result;
  }

  const ageDays = onboardingAgeDays(
    candidate.onboardedAt,
    reminderDate,
    candidate.timezone,
  );
  if (!inEarlyHabitWindow(ageDays)) {
    result.skipped += 1;
    return result;
  }

  if (candidate.middayRemindedOn === reminderDate) {
    result.skipped += 1;
    return result;
  }

  const [foodLogged, isTrainingDay, session, snapshot, priorFoodLogDays] =
    await Promise.all([
      dateHasFoodRecord(candidate.userId, reminderDate),
      dateIsTrainingDay(candidate.userId, reminderDate),
      getSessionOnDate(candidate.userId, reminderDate),
      dateShareSnapshot(candidate.userId, reminderDate),
      datePriorFoodLogDays(candidate.userId, reminderDate),
    ]);
  const sessionStatus = session?.status ?? null;
  let gymTemplateName: string | null = null;
  if (sessionStatus === "planned" && session?.template_id) {
    const names = await templateNamesById(candidate.userId, [
      session.template_id,
    ]);
    gymTemplateName = names.get(session.template_id) ?? null;
  }
  if (
    !gymTemplateName &&
    isTrainingDay === true &&
    sessionStatus === "planned"
  ) {
    gymTemplateName = await nextCircleName(candidate.userId);
  }

  const text = middayReminderText({
    foodLogged,
    priorFoodLogDays,
    protein: snapshot?.protein ?? 0,
    targetProtein: snapshot?.targetProtein ?? 0,
    isTrainingDay,
    sessionStatus,
    gymTemplateName,
    localHour: clock.hour,
  });
  if (!text) {
    result.skipped += 1;
    return result;
  }

  const claimed = await claimMiddayReminderDay(candidate.userId, reminderDate);
  if (!claimed) {
    result.skipped += 1;
    return result;
  }

  const env = getServerEnv();
  const sent = await sendDiaryMessage(candidate.telegramId, text, env);
  if (sent === "sent") {
    result.sent += 1;
    await resetReminderFailCount(candidate.userId);
    await trackEvent(candidate.userId, "reminder_sent", { kind: "midday" });
    return result;
  }

  if (sent === "blocked") {
    await disableReminders(candidate.userId);
    result.blocked += 1;
    await trackEvent(candidate.userId, "reminder_blocked", {
      kind: "midday",
    });
    return result;
  }

  await revertMiddayReminderDay(
    candidate.userId,
    reminderDate,
    candidate.middayRemindedOn,
  );
  await recordReminderSendFailure(candidate.userId);
  result.failed += 1;
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

async function sundayPack(
  userId: string,
  reminderDate: string,
): Promise<{
  recap: string | null;
  query: string | null;
  card: SundayCard | null;
}> {
  if (isoWeekdaySun0(reminderDate) !== 0) {
    return { recap: null, query: null, card: null };
  }

  try {
    const snapshot = await getReviewSnapshot(userId, 14, reminderDate);
    if (snapshot.brief.coverage === "empty") {
      return { recap: null, query: null, card: null };
    }
    const card = sundayCardFromBrief(snapshot.brief);
    return {
      recap: card
        ? sundayCardCaption(card)
        : weekRecapText(snapshot.brief.signals),
      query: card
        ? encodeSundayCard(card, getServerEnv().SESSION_SECRET)
        : null,
      card,
    };
  } catch (error) {
    console.error(error);
    return { recap: null, query: null, card: null };
  }
}

async function sendEvening(
  chatId: number,
  text: string,
  query: string | null,
  env: ReturnType<typeof getServerEnv>,
): Promise<DiarySendResult> {
  if (query) {
    const jpeg = await renderShareCardJpeg(query, env.SESSION_SECRET);
    if (jpeg) {
      return sendDiaryCardJpeg(
        chatId,
        { jpeg, caption: text, inlineQuery: query },
        env,
      );
    }
  }
  return sendDiaryMessage(chatId, text, env);
}

async function listDistinctReminderTimezones(): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const seen = new Set<string>();

  for (let from = 0; ; from += CANDIDATE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select("timezone")
      .eq("reminders_enabled", true)
      .not("onboarding_completed_at", "is", null)
      .order("timezone", { ascending: true })
      .range(from, from + CANDIDATE_PAGE - 1);

    if (page.error) {
      throw page.error;
    }

    const rows = page.data ?? [];
    for (const row of rows) {
      if (typeof row.timezone === "string" && row.timezone.trim()) {
        seen.add(row.timezone);
      } else {
        seen.add("");
      }
    }

    if (rows.length < CANDIDATE_PAGE) {
      break;
    }
  }

  return [...seen];
}

async function listReminderCandidates(
  timezones: readonly string[],
): Promise<ReminderCandidate[]> {
  if (timezones.length === 0) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const candidates: ReminderCandidate[] = [];

  for (let from = 0; ; from += CANDIDATE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, reminder_hour, reminded_on, midday_reminded_on, reminder_fail_count, onboarding_completed_at, users!inner(telegram_id, is_active)",
      )
      .eq("reminders_enabled", true)
      .not("onboarding_completed_at", "is", null)
      .in("timezone", [...timezones])
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
    reminderHour: normalizeReminderHour(Number(row.reminder_hour)),
    remindedOn: toDateOnly(row.reminded_on),
    middayRemindedOn: toDateOnly(row.midday_reminded_on),
    onboardedAt:
      typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : null,
    reminderFailCount: Math.max(0, Number(row.reminder_fail_count) || 0),
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

async function claimMiddayReminderDay(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const claimed = await supabase
    .from("user_settings")
    .update({
      midday_reminded_on: date,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .or(`midday_reminded_on.is.null,midday_reminded_on.neq.${date}`)
    .select("user_id");

  if (claimed.error) {
    throw claimed.error;
  }

  return (claimed.data?.length ?? 0) > 0;
}

async function revertMiddayReminderDay(
  userId: string,
  date: string,
  previous: string | null,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const reverted = await supabase
    .from("user_settings")
    .update({
      midday_reminded_on: previous,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("midday_reminded_on", date);

  if (reverted.error) {
    throw reverted.error;
  }
}
