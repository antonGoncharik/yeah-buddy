import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail, SessionFeel, WorkoutSet } from "@/lib/types";
import {
  bumpTracksByKg,
  saveExerciseTrack,
} from "@/lib/workout/exercise-tracks";
import { toSessionFeel } from "@/lib/workout/map-enums";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import {
  easedWeightTenPercent,
  peakWorkWeight,
  shouldEaseTrackAfterHolds,
  type TrackProgressSet,
  trackProgressFromWorkSets,
} from "@/lib/workout/track-progress";

const PRIOR_SESSIONS = 2;

function toProgressSets(sets: WorkoutSet[]): TrackProgressSet[] {
  return sets.map((set) => ({
    set_type: set.set_type,
    planned_weight: set.planned_weight,
    actual_weight: set.actual_weight,
    planned_reps: set.planned_reps,
    actual_reps: set.actual_reps,
    planned_reps_to: set.planned_reps_to,
  }));
}

export async function applyTrackProgressOnComplete(
  userId: string,
  detail: SessionDetail,
  feel: SessionFeel | null | undefined,
): Promise<void> {
  const sessionFeel = feel ?? detail.session.feel;

  for (const item of detail.exercises) {
    if (!item.track_id) {
      continue;
    }
    const sets = toProgressSets(item.sets);
    const outcome = trackProgressFromWorkSets({ feel: sessionFeel, sets });
    const step =
      item.exercise.weight_step > 0 ? item.exercise.weight_step : 2.5;
    const trackInfo = detail.tracks.find(
      (row) => row.exercise_id === item.exercise_id,
    );
    const working = peakWorkWeight(sets) ?? trackInfo?.weight ?? null;

    if (outcome === "up") {
      await bumpTracksByKg(userId, [item.exercise_id], step);
      continue;
    }

    const prior = await loadRecentTrackOutcomes(
      userId,
      item.exercise_id,
      detail.session.id,
      PRIOR_SESSIONS,
    );
    const outcomes = [...prior.map((row) => row.outcome), outcome];
    const weights = [...prior.map((row) => row.workingWeight), working];
    if (!shouldEaseTrackAfterHolds({ outcomes, workingWeights: weights })) {
      continue;
    }

    const current = working ?? trackInfo?.weight ?? null;
    if (current == null) {
      continue;
    }
    const next = easedWeightTenPercent(current, step);
    if (next == null) {
      continue;
    }
    await saveExerciseTrack(userId, item.exercise_id, { weight: next });
  }
}

async function loadRecentTrackOutcomes(
  userId: string,
  exerciseId: string,
  excludeSessionId: string,
  limit: number,
): Promise<Array<{ outcome: "up" | "hold"; workingWeight: number | null }>> {
  const supabase = createSupabaseServerClient();
  const links = await supabase
    .from("session_exercises")
    .select("session_id")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .not("track_id", "is", null)
    .neq("session_id", excludeSessionId);

  if (links.error) {
    throw links.error;
  }

  const sessionIds = [
    ...new Set(
      (links.data ?? [])
        .map((row) =>
          typeof row.session_id === "string" ? row.session_id : null,
        )
        .filter((id): id is string => id != null),
    ),
  ];
  if (sessionIds.length === 0) {
    return [];
  }

  const sessions = await supabase
    .from("workout_sessions")
    .select("id, feel, session_date, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("id", sessionIds)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 5);

  if (sessions.error) {
    throw sessions.error;
  }

  const ordered = (sessions.data ?? []).slice(0, limit);
  const workBySession = await loadWorkBySession(
    userId,
    ordered.map((row) => String(row.id)),
  );

  const out: Array<{ outcome: "up" | "hold"; workingWeight: number | null }> =
    [];
  for (const row of ordered) {
    const sessionId = String(row.id);
    const exercises = workBySession.get(sessionId) ?? [];
    const match = exercises.find((item) => item.exercise_id === exerciseId);
    if (!match) {
      continue;
    }
    const sets = toProgressSets(match.sets);
    out.push({
      outcome: trackProgressFromWorkSets({
        feel: toSessionFeel(row.feel),
        sets,
      }),
      workingWeight: peakWorkWeight(sets),
    });
  }

  return out;
}
