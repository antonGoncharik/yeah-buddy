import { getServerEnv } from "@/lib/env";
import { pluralDays } from "@/lib/i18n/plural";
import { onboardingAgeDays } from "@/lib/retention";
import { pauseCovers } from "@/lib/retention/pause";
import { disableReminders } from "@/lib/settings";
import {
  encodeMuscleWeekCard,
  muscleWeekCardCaption,
} from "@/lib/share/muscle-week-card";
import { loadMuscleWeekCard } from "@/lib/share/muscle-week-card-load";
import { renderShareCardJpeg } from "@/lib/share/share-card-jpeg";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDiaryCardJpeg, sendDiaryMessage } from "@/lib/telegram/bot";
import {
  isoWeekdaySun0,
  localClock,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";
import {
  dateHasFoodRecord,
  datePriorFoodLogDays,
  nextCircleName,
} from "@/lib/telegram/reminder-facts";
import {
  inQuietHours,
  isReminderExtraKind,
  type ReminderLogKind,
  reminderExtraBlocked,
  reminderExtraSentCount,
  reminderLogClaim,
  reminderLogRelease,
} from "@/lib/telegram/reminder-log";
import { buildWeeklyDigestForUser } from "@/lib/telegram/weekly-digest";

export interface ScheduledNoticeResult {
  sent: number;
  skipped: number;
  failed: number;
}

const NOTICE_PAGE = 100;

/** A weigh-in nudge after this many full days without a logged weight. */
export const WEIGH_IN_AFTER_DAYS = 4;
/** A gym nudge once the break reaches this many days. One message, not daily. */
export const GYM_NUDGE_AFTER_DAYS = 6;
/** Breaks longer than this are a pause, not a forgotten session. */
const GYM_NUDGE_MAX_DAYS = 8;
/** How long a missed fixed-hour notice may still go out. */
const NOTICE_CATCHUP_HOURS = 3;

/**
 * True during the due hour and a short catch-up after it, so a late cron tick
 * or a quiet-hours overlap does not drop the notice for the whole day.
 */
export function noticeHourDue(
  hour: number,
  dueHour: number,
  catchupHours = NOTICE_CATCHUP_HOURS,
): boolean {
  return hour >= dueHour && hour < dueHour + catchupHours;
}

export async function runScheduledNotices(
  now = new Date(),
): Promise<ScheduledNoticeResult> {
  const result: ScheduledNoticeResult = { sent: 0, skipped: 0, failed: 0 };
  const supabase = createSupabaseServerClient();

  for (let from = 0; ; from += NOTICE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, onboarding_completed_at, quiet_from, quiet_to, weekly_digest_enabled, monthly_report_enabled, weigh_in_enabled, streak_reminder_enabled, reminders_enabled, pause_from, pause_until, users!inner(telegram_id, is_active)",
      )
      .eq("reminders_enabled", true)
      .not("onboarding_completed_at", "is", null)
      .eq("users.is_active", true)
      .gt("users.telegram_id", 0)
      .order("user_id", { ascending: true })
      .range(from, from + NOTICE_PAGE - 1);

    if (page.error) {
      throw page.error;
    }

    const rows = page.data ?? [];
    for (const row of rows) {
      await deliverScheduledNotice(result, row, now);
    }
    if (rows.length < NOTICE_PAGE) {
      break;
    }
  }

  return result;
}

async function deliverScheduledNotice(
  result: ScheduledNoticeResult,
  row: {
    user_id: unknown;
    timezone: unknown;
    onboarding_completed_at: unknown;
    quiet_from: unknown;
    quiet_to: unknown;
    weekly_digest_enabled: unknown;
    monthly_report_enabled: unknown;
    weigh_in_enabled: unknown;
    streak_reminder_enabled: unknown;
    pause_from: unknown;
    pause_until: unknown;
    users: unknown;
  },
  now: Date,
): Promise<void> {
  const userId = typeof row.user_id === "string" ? row.user_id : null;
  const telegramId = readTelegramId(row.users);
  if (!userId || telegramId == null) {
    result.skipped += 1;
    return;
  }
  const timezone = resolveTimeZone(
    typeof row.timezone === "string" ? row.timezone : null,
  );
  const clock = localClock(now, timezone);
  const quietFrom = quietHour(row.quiet_from);
  const quietTo = quietHour(row.quiet_to);
  if (inQuietHours(clock.hour, quietFrom, quietTo)) {
    result.skipped += 1;
    return;
  }
  const pauseFrom =
    typeof row.pause_from === "string" ? row.pause_from.slice(0, 10) : null;
  const pauseUntil =
    typeof row.pause_until === "string" ? row.pause_until.slice(0, 10) : null;
  if (pauseCovers(clock.date, pauseFrom, pauseUntil)) {
    result.skipped += 1;
    return;
  }

  const onboarded =
    typeof row.onboarding_completed_at === "string"
      ? row.onboarding_completed_at
      : null;

  if (
    row.weekly_digest_enabled !== false &&
    isoWeekdaySun0(clock.date) === 1 &&
    noticeHourDue(clock.hour, 9)
  ) {
    await sendNotice(
      result,
      userId,
      telegramId,
      "weekly_digest",
      clock.date,
      () => buildWeeklyDigestForUser(userId, clock.date),
    );
  }

  if (
    row.monthly_report_enabled !== false &&
    clock.date.endsWith("-01") &&
    noticeHourDue(clock.hour, 9)
  ) {
    await sendNotice(
      result,
      userId,
      telegramId,
      "monthly_report",
      clock.date,
      async () => {
        const card = await loadMuscleWeekCard(userId);
        const line = card
          ? `${muscleWeekCardCaption(card)}\nМесяц начался — карта мышц за последнюю неделю.`
          : "Месяц начался. Открой «Как прошло», чтобы увидеть вес и приверженность.";
        if (card) {
          const env = getServerEnv();
          const query = encodeMuscleWeekCard(card, env.SESSION_SECRET);
          const jpeg = await renderShareCardJpeg(query, env.SESSION_SECRET);
          if (jpeg) {
            const sent = await sendDiaryCardJpeg(
              telegramId,
              { jpeg, caption: line, inlineQuery: query },
              env,
            );
            return sent === "sent" ? line : null;
          }
        }
        return line;
      },
    );
  }

  if (row.weigh_in_enabled !== false && noticeHourDue(clock.hour, 8)) {
    const missing = await daysSinceWeight(userId, clock.date);
    if (missing != null && missing >= WEIGH_IN_AFTER_DAYS) {
      const ago = `${missing} ${pluralDays(missing)}`;
      await sendNotice(
        result,
        userId,
        telegramId,
        "weigh_in",
        clock.date,
        async () =>
          `${ago} без веса. Одно взвешивание — и расход посчитается точнее.`,
      );
    }
  }

  if (noticeHourDue(clock.hour, 18)) {
    const gap = await daysSinceGym(userId, clock.date);
    if (
      gap != null &&
      gap >= GYM_NUDGE_AFTER_DAYS &&
      gap <= GYM_NUDGE_MAX_DAYS
    ) {
      const name = await nextCircleName(userId);
      if (name) {
        const ago = `${gap} ${pluralDays(gap)}`;
        await sendNotice(
          result,
          userId,
          telegramId,
          "gym",
          clock.date,
          async () => `${ago} без зала. Дальше «${name}».`,
        );
      }
    }
  }

  const age = onboardingAgeDays(onboarded, clock.date, timezone);
  if (
    row.streak_reminder_enabled !== false &&
    noticeHourDue(clock.hour, 20) &&
    age != null &&
    age >= 14
  ) {
    const streak = await datePriorFoodLogDays(userId, clock.date);
    const logged = await dateHasFoodRecord(userId, clock.date);
    if (!logged && streak >= 7) {
      const days = `${streak} ${pluralDays(streak)}`;
      await sendNotice(
        result,
        userId,
        telegramId,
        "streak",
        clock.date,
        async () => `Серия ${days} — запиши хоть один приём, пока она идёт.`,
      );
    }
  }
}

async function sendNotice(
  result: ScheduledNoticeResult,
  userId: string,
  telegramId: number,
  kind: ReminderLogKind,
  date: string,
  textOf: () => Promise<string | null>,
): Promise<void> {
  if (isReminderExtraKind(kind)) {
    const sentExtras = await reminderExtraSentCount(userId, date);
    if (reminderExtraBlocked(sentExtras)) {
      result.skipped += 1;
      return;
    }
  }
  const claimed = await reminderLogClaim(userId, kind, date);
  if (!claimed) {
    result.skipped += 1;
    return;
  }
  let delivered = false;
  try {
    const text = await textOf();
    if (!text) {
      result.skipped += 1;
      return;
    }
    if (kind === "monthly_report" && text.includes("Карта мышц")) {
      delivered = true;
      result.sent += 1;
      return;
    }
    const sent = await sendDiaryMessage(telegramId, text, getServerEnv());
    if (sent === "sent") {
      delivered = true;
      result.sent += 1;
      return;
    }
    if (sent === "blocked") {
      await disableReminders(userId);
    }
    result.failed += 1;
  } catch (error) {
    console.error(error);
    result.failed += 1;
  } finally {
    if (!delivered) {
      try {
        await reminderLogRelease(userId, kind, date);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

/**
 * Full days since the last logged weight, not counting today: the nudge goes
 * out at 08:00, before a morning weigh-in. Null when no weight was ever logged
 * or the lookup failed, so the copy never invents a gap.
 */
export async function daysSinceWeight(
  userId: string,
  date: string,
): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const rows = await supabase
    .from("days")
    .select("date")
    .eq("user_id", userId)
    .gt("body_weight", 0)
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1);
  if (rows.error) {
    return null;
  }
  const last = rows.data?.[0]?.date;
  if (typeof last !== "string") {
    return null;
  }
  return fullDaysBetween(last.slice(0, 10), date);
}

/**
 * Full days since the last completed session, today excluded. Null when the
 * user never trained or the lookup failed.
 */
export async function daysSinceGym(
  userId: string,
  date: string,
): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const rows = await supabase
    .from("workout_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .lt("session_date", date)
    .order("session_date", { ascending: false })
    .limit(1);
  if (rows.error) {
    return null;
  }
  const last = rows.data?.[0]?.session_date;
  if (typeof last !== "string") {
    return null;
  }
  return fullDaysBetween(last.slice(0, 10), date);
}

/** Days strictly between two ISO dates, or null when the span is not usable. */
function fullDaysBetween(fromDate: string, toDate: string): number | null {
  const [fromYear, fromMonth, fromDay] = fromDate.split("-").map(Number);
  const [toYear, toMonth, toDay] = toDate.split("-").map(Number);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return null;
  }
  return Math.round((to - from) / 86_400_000) - 1;
}

function quietHour(value: unknown): number | null {
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function readTelegramId(value: unknown): number | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") {
    return null;
  }
  const id = Number(Reflect.get(row, "telegram_id"));
  return Number.isFinite(id) && id > 0 ? id : null;
}
