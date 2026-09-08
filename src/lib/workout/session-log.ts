import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PhaseType,
  ProgressPoint,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";
import {
  firstWorkPlanScore,
  firstWorkSet,
  formatWorkSummary,
} from "@/lib/workout/session-format";

export interface SessionWorkInfo {
  summary: string | null;
  plan_hit: number;
  plan_total: number;
}

export async function listSessionWorkInfo(
  userId: string,
  sessions: WorkoutSession[],
): Promise<Map<string, SessionWorkInfo>> {
  const gymIds = sessions
    .filter((session) => session.kind === "gym")
    .map((session) => session.id);
  const info = new Map<string, SessionWorkInfo>();
  if (gymIds.length === 0) {
    return info;
  }

  const grouped = await loadWorkBySession(userId, gymIds);
  for (const [sessionId, exercises] of grouped) {
    let plan_hit = 0;
    let plan_total = 0;
    for (const item of exercises) {
      const score = firstWorkPlanScore(item.sets);
      plan_hit += score.hit;
      plan_total += score.total;
    }
    info.set(sessionId, {
      summary: formatWorkSummary(exercises),
      plan_hit,
      plan_total,
    });
  }

  return info;
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
    .eq("kind", "gym")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (sessionsResult.error) {
    if (isMissingKindColumn(sessionsResult.error.message)) {
      return listExerciseWorkPointsWithoutKind(userId);
    }
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

async function listExerciseWorkPointsWithoutKind(
  userId: string,
): Promise<Map<string, ProgressPoint[]>> {
  const supabase = createSupabaseServerClient();
  const sessionsResult = await supabase
    .from("workout_sessions")
    .select("id, session_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  return pointsFromSessions(
    userId,
    (sessionsResult.data ?? []).map((row) => ({
      id: String(row.id),
      session_date: String(row.session_date).slice(0, 10),
      phase_id: null,
    })),
  );
}

async function pointsFromSessions(
  userId: string,
  sessions: Array<{
    id: string;
    session_date: string;
    phase_id: string | null;
  }>,
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
      ? `${dateLabel} · ${PHASE_TYPE_LABELS[meta.phase_type]}`
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
): Promise<
  Map<string, { phase_type: PhaseType; macro_number: number | null }>
> {
  const unique = [...new Set(phaseIds)];
  const meta = new Map<
    string,
    { phase_type: PhaseType; macro_number: number | null }
  >();
  if (unique.length === 0) {
    return meta;
  }

  const supabase = createSupabaseServerClient();
  const phasesResult = await supabase
    .from("workout_phases")
    .select("id, phase_type, macro_cycle_id")
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
    const phaseType = toPhaseType(row.phase_type);
    if (typeof row.id !== "string" || !phaseType) {
      continue;
    }
    meta.set(row.id, {
      phase_type: phaseType,
      macro_number:
        typeof row.macro_cycle_id === "string"
          ? (numbers.get(row.macro_cycle_id) ?? null)
          : null,
    });
  }

  return meta;
}

function toPhaseType(value: unknown): PhaseType | null {
  if (
    value === "ramp" ||
    value === "volume" ||
    value === "peak" ||
    value === "deload"
  ) {
    return value;
  }
  return null;
}

async function loadWorkBySession(
  userId: string,
  sessionIds: string[],
): Promise<
  Map<string, Array<{ exercise_id: string; name: string; sets: WorkoutSet[] }>>
> {
  const grouped = new Map<
    string,
    Array<{ exercise_id: string; name: string; sets: WorkoutSet[] }>
  >();
  if (sessionIds.length === 0) {
    return grouped;
  }

  const supabase = createSupabaseServerClient();
  const exerciseRows = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id, sort_order")
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .order("sort_order", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const sessionExercises = exerciseRows.data ?? [];
  if (sessionExercises.length === 0) {
    return grouped;
  }

  const exerciseIds = [
    ...new Set(sessionExercises.map((row) => String(row.exercise_id))),
  ];
  const names = await exerciseNamesById(userId, exerciseIds);
  const setsByExercise = await listWorkSetsBySessionExercise(
    userId,
    sessionExercises.map((row) => String(row.id)),
  );

  for (const row of sessionExercises) {
    const sessionId = String(row.session_id);
    const exerciseId = String(row.exercise_id);
    const current = grouped.get(sessionId) ?? [];
    current.push({
      exercise_id: exerciseId,
      name: names.get(exerciseId) ?? "упражнение",
      sets: setsByExercise.get(String(row.id)) ?? [],
    });
    grouped.set(sessionId, current);
  }

  return grouped;
}

async function listWorkSetsBySessionExercise(
  userId: string,
  sessionExerciseIds: string[],
): Promise<Map<string, WorkoutSet[]>> {
  const map = new Map<string, WorkoutSet[]>();
  if (sessionExerciseIds.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("set_type", "work")
    .in("session_exercise_id", sessionExerciseIds)
    .order("set_number", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const set = mapWorkSet(row as Record<string, unknown>);
    const current = map.get(set.session_exercise_id) ?? [];
    current.push(set);
    map.set(set.session_exercise_id, current);
  }

  return map;
}

async function exerciseNamesById(userId: string, ids: string[]) {
  const names = new Map<string, string>();
  if (ids.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("id, name, short_name")
    .eq("user_id", userId)
    .in("id", ids);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const name =
      typeof row.short_name === "string" && row.short_name.trim() !== ""
        ? row.short_name
        : String(row.name);
    names.set(String(row.id), name);
  }

  return names;
}

function mapWorkSet(row: Record<string, unknown>): WorkoutSet {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_exercise_id: String(row.session_exercise_id),
    set_type: "work",
    set_number: toNumber(row.set_number),
    planned_weight: toNullableNumber(row.planned_weight),
    planned_reps: toNullableNumber(row.planned_reps),
    planned_seconds: toNullableNumber(row.planned_seconds),
    actual_weight: toNullableNumber(row.actual_weight),
    actual_reps: toNullableNumber(row.actual_reps),
    actual_seconds: toNullableNumber(row.actual_seconds),
    is_completed: Boolean(row.is_completed),
    created_at: String(row.created_at),
  };
}

function formatWorkDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}

function isMissingKindColumn(message: string): boolean {
  return message.includes("kind") && message.includes("does not exist");
}
