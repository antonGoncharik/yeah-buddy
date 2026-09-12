import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProgressPoint } from "@/lib/types";
import {
  formatWorkDate,
  loadPhaseMeta,
} from "@/lib/workout/exercise-work-phase";
import { phaseLabel } from "@/lib/workout/labels";
import { firstWorkSet } from "@/lib/workout/session-format";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import {
  circleTonnageByRound,
  workTonnage,
} from "@/lib/workout/session-tonnage";
import { listActiveTemplates } from "@/lib/workout/templates";

interface SessionPointSource {
  id: string;
  session_date: string;
  phase_id: string | null;
}

export async function listExerciseWorkPoints(
  userId: string,
): Promise<Map<string, ProgressPoint[]>> {
  const supabase = createSupabaseServerClient();
  const [sessionsResult, active] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, session_date, phase_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("template_id", "is", null)
      .order("session_date", { ascending: true })
      .order("created_at", { ascending: true }),
    listActiveTemplates(userId),
  ]);

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const sessions = sessionsResult.data ?? [];
  return pointsFromSessions(
    userId,
    sessions.map((row) => ({
      id: String(row.id),
      session_date: String(row.session_date).slice(0, 10),
      phase_id:
        typeof row.phase_id === "string" && row.phase_id !== ""
          ? row.phase_id
          : null,
    })),
    Math.max(active.length, 1),
  );
}

async function pointsFromSessions(
  userId: string,
  sessions: SessionPointSource[],
  circleSize: number,
): Promise<Map<string, ProgressPoint[]>> {
  const points = new Map<string, ProgressPoint[]>();
  if (sessions.length === 0) {
    return points;
  }

  const phaseBySession = new Map(
    sessions.map((session) => [session.id, session.phase_id]),
  );
  const phaseMeta = await loadPhaseMeta(
    userId,
    sessions.flatMap((session) => (session.phase_id ? [session.phase_id] : [])),
  );
  const grouped = await loadWorkBySession(
    userId,
    sessions.map((session) => session.id),
  );

  const draft: Array<
    ProgressPoint & { sessionIndex: number; exerciseId: string }
  > = [];

  for (let index = 0; index < sessions.length; index += 1) {
    const session = sessions[index];
    if (!session) {
      continue;
    }
    const exercises = grouped.get(session.id) ?? [];
    const phaseId = phaseBySession.get(session.id) ?? null;
    const meta = phaseId ? (phaseMeta.get(phaseId) ?? null) : null;
    const dateLabel = formatWorkDate(session.session_date);
    const label = meta
      ? `${dateLabel} · ${phaseLabel(meta.phase_type, meta.name)}`
      : dateLabel;

    for (const item of exercises) {
      const work = firstWorkSet(item.sets) ?? item.sets[0];
      const weight = work?.actual_weight ?? work?.planned_weight;
      if (work == null || weight == null || weight <= 0) {
        continue;
      }

      const seconds = work.actual_seconds ?? work.planned_seconds;
      draft.push({
        sessionIndex: index,
        exerciseId: item.exercise_id,
        date: session.session_date,
        weight,
        seconds: seconds != null && seconds > 0 ? seconds : null,
        tonnage: workTonnage(item.sets),
        circle_tonnage: null,
        body_weight: null,
        relative: null,
        phase_type: meta?.phase_type ?? null,
        macro_number: meta?.macro_number ?? null,
        label,
      });
    }
  }

  const circle = circleTonnageByRound(draft, circleSize);
  for (let index = 0; index < draft.length; index += 1) {
    const row = draft[index];
    if (!row) {
      continue;
    }
    const list = points.get(row.exerciseId) ?? [];
    list.push({
      date: row.date,
      weight: row.weight,
      seconds: row.seconds,
      tonnage: row.tonnage,
      circle_tonnage: circle[index] ?? null,
      body_weight: row.body_weight,
      relative: row.relative,
      phase_type: row.phase_type,
      macro_number: row.macro_number,
      label: row.label,
    });
    points.set(row.exerciseId, list);
  }

  return points;
}
