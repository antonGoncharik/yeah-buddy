import { isIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RecentWorkoutSession, SessionStatus } from "@/lib/types";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { templateNamesById } from "@/lib/workout/session-names";
import { listSessionWorkInfo } from "@/lib/workout/session-work-info";

export async function countCompletedSessions(userId: string): Promise<number> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (result.error) {
    throw result.error;
  }

  return result.count ?? 0;
}

export async function getLastCompletedDateBefore(
  userId: string,
  beforeDate: string,
): Promise<string | null> {
  if (!isIsoDate(beforeDate)) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .lt("session_date", beforeDate)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  const date = String(result.data?.session_date ?? "").slice(0, 10);
  return isIsoDate(date) ? date : null;
}

export async function listSessionHistory(
  userId: string,
  options: {
    before?: string;
    since?: string;
    until?: string;
    limit: number;
    statuses?: SessionStatus[];
  },
): Promise<{ items: RecentWorkoutSession[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 120);
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

  if (options.until && isIsoDate(options.until)) {
    query = query.lte("session_date", options.until);
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
  const [names, work] = await Promise.all([
    templateNamesById(
      userId,
      sessions.flatMap((session) =>
        session.template_id ? [session.template_id] : [],
      ),
    ),
    listSessionWorkInfo(userId, sessions),
  ]);

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
        close_kind:
          session.status === "completed"
            ? (info?.close_kind ?? "as_planned")
            : null,
      };
    }),
    next_before: hasMore ? (sessions.at(-1)?.session_date ?? null) : null,
  };
}
