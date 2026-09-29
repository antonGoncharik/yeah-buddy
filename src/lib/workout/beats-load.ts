import { toNullableNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionBeats, WorkoutSession } from "@/lib/types";
import { firstWorkSet } from "@/lib/workout/session-format";
import { loadWorkBySession } from "@/lib/workout/session-log-load";

const PAGE = 1000;
const ID_CHUNK = 80;

export async function loadSessionBeats(
  userId: string,
  session: WorkoutSession,
  exerciseIds: string[],
): Promise<SessionBeats> {
  const bodyWeight = await bodyOnOrBefore(userId, session.session_date);
  const peaks = new Map<string, number | null>(
    exerciseIds.map((id) => [id, null]),
  );
  if (exerciseIds.length === 0) {
    return { body_weight: bodyWeight, peaks: [] };
  }

  const priorIds = await listPriorSessionIds(
    userId,
    session.id,
    session.session_date,
  );
  const wanted = new Set(exerciseIds);
  for (let index = 0; index < priorIds.length; index += ID_CHUNK) {
    const grouped = await loadWorkBySession(
      userId,
      priorIds.slice(index, index + ID_CHUNK),
    );
    for (const exercises of grouped.values()) {
      for (const item of exercises) {
        if (!wanted.has(item.exercise_id)) {
          continue;
        }
        const work = firstWorkSet(item.sets);
        const weight = work?.actual_weight ?? work?.planned_weight;
        if (weight == null || weight <= 0) {
          continue;
        }
        const current = peaks.get(item.exercise_id);
        if (current == null || weight > current) {
          peaks.set(item.exercise_id, weight);
        }
      }
    }
  }

  return {
    body_weight: bodyWeight,
    peaks: exerciseIds.map((id) => ({
      exercise_id: id,
      prior_peak: peaks.get(id) ?? null,
    })),
  };
}

async function listPriorSessionIds(
  userId: string,
  sessionId: string,
  sessionDate: string,
): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const ids: string[] = [];

  for (let from = 0; from < PAGE * 5; from += PAGE) {
    const result = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("template_id", "is", null)
      .neq("id", sessionId)
      .lte("session_date", sessionDate)
      .order("session_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);

    if (result.error) {
      throw result.error;
    }

    const rows = result.data ?? [];
    for (const row of rows) {
      if (typeof row.id === "string") {
        ids.push(row.id);
      }
    }
    if (rows.length < PAGE) {
      break;
    }
  }

  return ids;
}

async function bodyOnOrBefore(
  userId: string,
  date: string,
): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("body_weight")
    .eq("user_id", userId)
    .lte("date", date)
    .not("body_weight", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return toNullableNumber(result.data?.body_weight);
}
