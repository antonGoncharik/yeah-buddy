import type { ServerEnv } from "@/lib/env";
import { readInboxChatId } from "@/lib/inbox/letter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBot } from "@/lib/telegram/bot";

export type AuthorDigestStats = {
  newUsers: number;
  activeUsers: number;
  d7Rate: number | null;
  donationStars: number;
  reminderBlocked: number;
  syncFailed: number;
  aiFailed: number;
};

export async function collectAuthorDigestStats(
  sinceIso: string,
): Promise<AuthorDigestStats> {
  const supabase = createSupabaseServerClient();

  const [
    newUsers,
    activeUsers,
    donations,
    reminderBlocked,
    syncFailed,
    aiFailed,
    retention,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso),
    supabase
      .from("product_events")
      .select("user_id")
      .gte("created_at", sinceIso)
      .in("event", ["food_logged", "workout_completed"])
      .not("user_id", "is", null),
    supabase.from("donations").select("stars").gte("created_at", sinceIso),
    supabase
      .from("product_events")
      .select("id", { count: "exact", head: true })
      .eq("event", "reminder_blocked")
      .gte("created_at", sinceIso),
    supabase
      .from("product_events")
      .select("id", { count: "exact", head: true })
      .eq("event", "sync_failed")
      .gte("created_at", sinceIso),
    supabase
      .from("product_events")
      .select("id", { count: "exact", head: true })
      .in("event", ["ai_failed", "ai_empty"])
      .gte("created_at", sinceIso),
    supabase
      .from("analytics_retention_weekly")
      .select("d7_rate")
      .order("cohort_week", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const activeIds = new Set(
    (activeUsers.data ?? [])
      .map((row) => row.user_id)
      .filter((id): id is string => typeof id === "string"),
  );

  const donationStars = (donations.data ?? []).reduce(
    (sum, row) => sum + (typeof row.stars === "number" ? row.stars : 0),
    0,
  );

  const d7Raw = retention.data?.d7_rate;
  const d7Rate =
    d7Raw == null || d7Raw === ""
      ? null
      : typeof d7Raw === "number"
        ? d7Raw
        : Number.parseFloat(String(d7Raw));

  return {
    newUsers: newUsers.count ?? 0,
    activeUsers: activeIds.size,
    d7Rate: d7Rate != null && Number.isFinite(d7Rate) ? d7Rate : null,
    donationStars,
    reminderBlocked: reminderBlocked.count ?? 0,
    syncFailed: syncFailed.count ?? 0,
    aiFailed: aiFailed.count ?? 0,
  };
}

export function formatAuthorDigest(stats: AuthorDigestStats): string {
  const d7 =
    stats.d7Rate == null ? "—" : `${Math.round(stats.d7Rate * 1000) / 10}%`;
  return [
    "Неделя в Yeah Buddy",
    `Новых: ${stats.newUsers}`,
    `Активных (еда/зал): ${stats.activeUsers}`,
    `D7 (посл. когорта): ${d7}`,
    `Донаты: ${stats.donationStars} ⭐`,
    `Блокировок бота (напоминания): ${stats.reminderBlocked}`,
    `Синк-ошибок: ${stats.syncFailed}`,
    `AI сбоев/пусто: ${stats.aiFailed}`,
  ].join("\n");
}

export async function sendAuthorDigest(env: ServerEnv): Promise<{
  sent: boolean;
  stats: AuthorDigestStats;
}> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const stats = await collectAuthorDigestStats(since.toISOString());
  const adminId = readInboxChatId(env.INBOX_CHAT_ID);
  if (adminId == null) {
    return { sent: false, stats };
  }

  const text = formatAuthorDigest(stats);
  await createBot(env).api.sendMessage(adminId, text);
  return { sent: true, stats };
}
