import { BOT_REMINDER_FOOD, botReminderGym } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { disableReminders, saveUserTimezone } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDiaryMessage } from "@/lib/telegram/bot";
import { getSessionOnDate } from "@/lib/workout/sessions";
import { templateAfter } from "@/lib/workout/templates";

export const DEFAULT_TIMEZONE = "Europe/Moscow";
export const REMINDER_HOUR = 20;

const CANDIDATE_PAGE = 100;

export interface ReminderFacts {
  foodLogged: boolean;
  gymLogged: boolean;
  nextTemplateName: string | null;
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
  remindedOn: string | null;
}

export function resolveTimeZone(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.length > 64) {
    return DEFAULT_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function localClock(
  now: Date,
  timeZone: string,
): { date: string; hour: number } {
  const zone = resolveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(read("hour"));

  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number.isFinite(hour) ? hour : 0,
  };
}

export function isReminderHour(hour: number): boolean {
  return hour === REMINDER_HOUR;
}

export function reminderText(facts: ReminderFacts): string | null {
  if (facts.foodLogged || facts.gymLogged) {
    return null;
  }

  const lines = [BOT_REMINDER_FOOD];
  if (facts.nextTemplateName) {
    lines.push(botReminderGym(facts.nextTemplateName));
  }

  return lines.join("\n");
}

export function isCronAuthorized(
  request: Request,
  secret: string | undefined,
): boolean {
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function rememberUserTimezone(
  userId: string,
  timeZone: string | null | undefined,
): Promise<void> {
  if (!timeZone) {
    return;
  }

  try {
    await saveUserTimezone(userId, resolveTimeZone(timeZone));
  } catch (error) {
    console.error(error);
  }
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

async function dateHasFoodRecord(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("id, meals!inner(id, meal_items!inner(id))")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data != null;
}

async function nextCircleName(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const templatesResult = await supabase
    .from("workout_templates")
    .select("id, name, sort_order")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (templatesResult.error) {
    throw templatesResult.error;
  }

  const templates = (templatesResult.data ?? []).flatMap((row) => {
    const record = row as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }
    return [{ id: record.id, name: record.name }];
  });
  if (templates.length === 0) {
    return null;
  }

  const skipped = new Set(await skipTemplateIds(userId));
  const lastId = await lastCompletedTemplateId(userId);
  let current = templateAfter(templates, lastId);

  for (let step = 0; step < templates.length; step += 1) {
    if (!current) {
      return templates[0]?.name ?? null;
    }
    if (!skipped.has(current.id)) {
      return current.name;
    }
    current = templateAfter(templates, current.id);
  }

  return templates[0]?.name ?? null;
}

async function skipTemplateIds(userId: string): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_settings")
    .select("skip_template_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  const raw = result.data?.skip_template_ids;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id): id is string => typeof id === "string");
}

async function lastCompletedTemplateId(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const phase = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (phase.error) {
    throw phase.error;
  }

  let query = supabase
    .from("workout_sessions")
    .select("template_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (typeof phase.data?.id === "string") {
    query = query.eq("phase_id", phase.data.id);
  }

  const last = await query.maybeSingle();
  if (last.error) {
    throw last.error;
  }

  return typeof last.data?.template_id === "string"
    ? last.data.template_id
    : null;
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
