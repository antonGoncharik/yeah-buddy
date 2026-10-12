import { shiftIsoDate } from "@/lib/day/dates";
import { getServerEnv } from "@/lib/env";
import { onboardingAgeDays } from "@/lib/retention";
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
} from "@/lib/telegram/reminder-facts";
import {
  inQuietHours,
  type ReminderLogKind,
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

export async function runScheduledNotices(
  now = new Date(),
): Promise<ScheduledNoticeResult> {
  const result: ScheduledNoticeResult = { sent: 0, skipped: 0, failed: 0 };
  const supabase = createSupabaseServerClient();

  for (let from = 0; ; from += NOTICE_PAGE) {
    const page = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, onboarding_completed_at, quiet_from, quiet_to, weekly_digest_enabled, monthly_report_enabled, reminders_enabled, users!inner(telegram_id, is_active)",
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

  const onboarded =
    typeof row.onboarding_completed_at === "string"
      ? row.onboarding_completed_at
      : null;

  if (
    row.weekly_digest_enabled !== false &&
    isoWeekdaySun0(clock.date) === 1 &&
    clock.hour === 9
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
    clock.hour === 9
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

  if (clock.hour === 8) {
    const missing = await missingWeightStreak(userId, clock.date);
    if (missing >= 2) {
      await sendNotice(
        result,
        userId,
        telegramId,
        "weigh_in",
        clock.date,
        async () => "Два дня без веса — одна цифра помогает цели.",
      );
    }
  }

  const age = onboardingAgeDays(onboarded, clock.date, timezone);
  if (clock.hour === 20 && age != null && age >= 14) {
    const streak = await datePriorFoodLogDays(userId, clock.date);
    const logged = await dateHasFoodRecord(userId, clock.date);
    if (!logged && streak >= 7) {
      await sendNotice(
        result,
        userId,
        telegramId,
        "streak",
        clock.date,
        async () => `Серия ${streak} дней — запиши хотя бы завтрак.`,
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

async function missingWeightStreak(
  userId: string,
  date: string,
): Promise<number> {
  const dates = [date, shiftIsoDate(date, -1), shiftIsoDate(date, -2)];
  const supabase = createSupabaseServerClient();
  const rows = await supabase
    .from("days")
    .select("date, body_weight")
    .eq("user_id", userId)
    .in("date", dates);
  if (rows.error) {
    return 0;
  }
  const weighed = new Set(
    (rows.data ?? [])
      .filter((row) => Number(row.body_weight) > 0)
      .map((row) => String(row.date).slice(0, 10)),
  );
  let missing = 0;
  for (const day of dates) {
    if (weighed.has(day)) {
      break;
    }
    missing += 1;
  }
  return missing;
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
