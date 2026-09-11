import { isIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RecentWorkoutSession, SessionStatus } from "@/lib/types";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { listSessionWorkInfo } from "@/lib/workout/session-log";
import { templateNamesById } from "@/lib/workout/session-names";

export async function listSessionHistory(
  userId: string,
  options: {
    before?: string;
    since?: string;
    limit: number;
    statuses?: SessionStatus[];
  },
): Promise<{ items: RecentWorkoutSession[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 50);
  const statuses = options.statuses ?? ["completed", "skipped"];
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", statuses)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options.before && isIsoDate(options.before)) {
    query = query.lt("session_date", options.before);
  }

  if (options.since && isIsoDate(options.since)) {
    query = query.gte("session_date", options.since);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
  const hasMore = rows.length > limit;
  const sessions = hasMore ? rows.slice(0, limit) : rows;
  const names = await templateNamesById(
    userId,
    sessions.flatMap((session) =>
      session.template_id ? [session.template_id] : [],
    ),
  );
  const work = await listSessionWorkInfo(userId, sessions);

  return {
    items: sessions.map((session) => {
      const info = work.get(session.id);
      return {
        session,
        template_name: session.template_id
          ? (names.get(session.template_id) ?? null)
          : null,
        summary: info?.summary ?? null,
        plan_hit: info?.plan_hit ?? 0,
        plan_total: info?.plan_total ?? 0,
      };
    }),
    next_before: hasMore ? (sessions.at(-1)?.session_date ?? null) : null,
  };
}
