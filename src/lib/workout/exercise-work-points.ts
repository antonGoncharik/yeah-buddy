import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseType, ProgressPoint } from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import { phaseLabel } from "@/lib/workout/labels";
import { firstWorkSet } from "@/lib/workout/session-format";
import { loadWorkBySession } from "@/lib/workout/session-log-load";

interface PhaseMeta {
  phase_type: PhaseType;
  name: string | null;
  macro_number: number | null;
}

interface SessionPointSource {
  id: string;
  session_date: string;
  phase_id: string | null;
}

export async function listExerciseWorkPoints(
  userId: string,
): Promise<Map<string, ProgressPoint[]>> {
  const supabase = createSupabaseServerClient();
  const sessionsResult = await supabase
    .from("workout_sessions")
    .select("id, session_date, phase_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

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
  );
}

async function pointsFromSessions(
  userId: string,
  sessions: SessionPointSource[],
): Promise<Map<string, ProgressPoint[]>> {
  const points = new Map<string, ProgressPoint[]>();
  if (sessions.length === 0) {
    return points;
  }

  const dateBySession = new Map(
    sessions.map((session) => [session.id, session.session_date]),
  );
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

  for (const [sessionId, exercises] of grouped) {
    const date = dateBySession.get(sessionId);
    if (!date) {
      continue;
    }

    const phaseId = phaseBySession.get(sessionId) ?? null;
    const meta = phaseId ? (phaseMeta.get(phaseId) ?? null) : null;
    const dateLabel = formatWorkDate(date);
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
      const list = points.get(item.exercise_id) ?? [];
      list.push({
        date,
        weight,
        seconds: seconds != null && seconds > 0 ? seconds : null,
        body_weight: null,
        relative: null,
        phase_type: meta?.phase_type ?? null,
        macro_number: meta?.macro_number ?? null,
        label,
      });
      points.set(item.exercise_id, list);
    }
  }

  return points;
}

async function loadPhaseMeta(
  userId: string,
  phaseIds: string[],
): Promise<Map<string, PhaseMeta>> {
  const unique = [...new Set(phaseIds)];
  const meta = new Map<string, PhaseMeta>();
  if (unique.length === 0) {
    return meta;
  }

  const supabase = createSupabaseServerClient();
  const phasesResult = await supabase
    .from("workout_phases")
    .select("id, phase_type, name, macro_cycle_id")
    .eq("user_id", userId)
    .in("id", unique);

  if (phasesResult.error) {
    throw phasesResult.error;
  }

  const macroIds = [
    ...new Set(
      (phasesResult.data ?? []).flatMap((row) =>
        typeof row.macro_cycle_id === "string" ? [row.macro_cycle_id] : [],
      ),
    ),
  ];
  const numbers = new Map<string, number>();
  if (macroIds.length > 0) {
    const macrosResult = await supabase
      .from("macro_cycles")
      .select("id, number")
      .eq("user_id", userId)
      .in("id", macroIds);
    if (macrosResult.error) {
      throw macrosResult.error;
    }
    for (const row of macrosResult.data ?? []) {
      if (typeof row.id === "string" && Number.isFinite(Number(row.number))) {
        numbers.set(row.id, Number(row.number));
      }
    }
  }

  for (const row of phasesResult.data ?? []) {
    const phaseType = isPhaseType(row.phase_type) ? row.phase_type : null;
    if (typeof row.id !== "string" || !phaseType) {
      continue;
    }
    meta.set(row.id, {
      phase_type: phaseType,
      name: typeof row.name === "string" ? row.name : null,
      macro_number:
        typeof row.macro_cycle_id === "string"
          ? (numbers.get(row.macro_cycle_id) ?? null)
          : null,
    });
  }

  return meta;
}

function formatWorkDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
