import { toNullableNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionBeats, WorkoutSession } from "@/lib/types";
import { peakWorkWeight } from "@/lib/workout/session-format";
import { loadWorkBySession } from "@/lib/workout/session-log-load";

const PAGE = 1000;
const ID_CHUNK = 80;

export async function loadSessionBeats(
  userId: string,
  session: WorkoutSession,
  exerciseIds: string[],
): Promise<SessionBeats> {
  const bodyWeight = await bodyOnOrBefore(userId, session.session_date);
  const peaks = new Map<string, { weight: number; date: string } | null>(
    exerciseIds.map((id) => [id, null]),
  );
  if (exerciseIds.length === 0) {
    return { body_weight: bodyWeight, peaks: [] };
  }

  const prior = await listPriorSessions(
    userId,
    session.id,
    session.session_date,
  );
  const dateById = new Map(prior.map((row) => [row.id, row.date]));
  const wanted = new Set(exerciseIds);
  for (let index = 0; index < prior.length; index += ID_CHUNK) {
    const chunk = prior.slice(index, index + ID_CHUNK);
    const grouped = await loadWorkBySession(
      userId,
      chunk.map((row) => row.id),
    );
    for (const [sessionId, exercises] of grouped) {
      const date = dateById.get(sessionId);
      if (!date) {
        continue;
      }
      for (const item of exercises) {
        if (!wanted.has(item.exercise_id)) {
          continue;
        }
        const weight = peakWorkWeight(item.sets);
        if (weight == null) {
          continue;
        }
        const current = peaks.get(item.exercise_id);
        if (
          current == null ||
          weight > current.weight ||
          (weight === current.weight && date >= current.date)
        ) {
          peaks.set(item.exercise_id, { weight, date });
        }
      }
    }
  }

  return {
    body_weight: bodyWeight,
    peaks: exerciseIds.map((id) => {
      const peak = peaks.get(id);
      return {
        exercise_id: id,
        prior_peak: peak?.weight ?? null,
        prior_on: peak?.date ?? null,
      };
    }),
  };
}

async function listPriorSessions(
  userId: string,
  sessionId: string,
  sessionDate: string,
): Promise<Array<{ id: string; date: string }>> {
  const supabase = createSupabaseServerClient();
  const prior: Array<{ id: string; date: string }> = [];

  for (let from = 0; from < PAGE * 5; from += PAGE) {
    const result = await supabase
      .from("workout_sessions")
      .select("id, session_date")
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
      const date = String(row.session_date ?? "").slice(0, 10);
      if (typeof row.id === "string" && date.length === 10) {
        prior.push({ id: row.id, date });
      }
    }
    if (rows.length < PAGE) {
      break;
    }
  }

  return prior;
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
