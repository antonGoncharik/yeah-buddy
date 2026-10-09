import { calendarToday, shiftIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MuscleSnapshot } from "@/lib/types";
import {
  buildMuscleSnapshot,
  type ExerciseMuscleMeta,
  parseMuscleHorizonDays,
} from "@/lib/workout/muscle-aggregate";
import { getNextTemplate } from "@/lib/workout/rotation";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import { listTemplateExerciseMap } from "@/lib/workout/template-exercises";

export { parseMuscleHorizonDays };

export async function getMuscleSnapshot(
  userId: string,
  horizonDays: number,
): Promise<MuscleSnapshot> {
  const until = calendarToday();
  const since = shiftIsoDate(until, 1 - horizonDays);

  const supabase = createSupabaseServerClient();
  const sessionsResult = await supabase
    .from("workout_sessions")
    .select("id, session_date, status, template_id, phase_id")
    .eq("user_id", userId)
    .in("status", ["completed", "skipped"])
    .gte("session_date", since)
    .lte("session_date", until)
    .order("session_date", { ascending: true });

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const sessions = (sessionsResult.data ?? []).map((row) => ({
    session_id: String(row.id),
    session_date: String(row.session_date).slice(0, 10),
    status: (row.status === "skipped" ? "skipped" : "completed") as
      | "completed"
      | "skipped",
    template_id:
      typeof row.template_id === "string" && row.template_id !== ""
        ? row.template_id
        : null,
    phase_id:
      typeof row.phase_id === "string" && row.phase_id !== ""
        ? row.phase_id
        : null,
  }));

  const completedIds = sessions
    .filter((item) => item.status === "completed")
    .map((item) => item.session_id);
  const workBySession = await loadWorkBySession(userId, completedIds);

  const templateIds = [
    ...new Set(
      sessions
        .map((item) => item.template_id)
        .filter((id): id is string => id != null),
    ),
  ];

  const [templateMap, macroPhaseId] = await Promise.all([
    listTemplateExerciseMap(userId, templateIds),
    currentPhaseId(userId),
  ]);

  const templateExerciseIds = new Map<string, string[]>();
  for (const [templateId, row] of templateMap) {
    templateExerciseIds.set(
      templateId,
      row.exercises.map((exercise) => exercise.id),
    );
  }

  const nextTemplate = await getNextTemplate(userId, macroPhaseId);
  const plannedExerciseIds =
    nextTemplate?.exercises.map((item) => item.id) ?? [];

  const exerciseIds = new Set<string>(plannedExerciseIds);
  for (const exercises of workBySession.values()) {
    for (const row of exercises) {
      exerciseIds.add(row.exercise_id);
    }
  }
  for (const ids of templateExerciseIds.values()) {
    for (const id of ids) {
      exerciseIds.add(id);
    }
  }

  const metaByExercise = await loadExerciseMuscleMeta(userId, [...exerciseIds]);

  const sessionPayload = sessions.map((session) => ({
    session_id: session.session_id,
    session_date: session.session_date,
    status: session.status,
    template_id: session.template_id,
    exercises:
      session.status === "completed"
        ? (workBySession.get(session.session_id) ?? []).map((row) => ({
            exercise_id: row.exercise_id,
            sets: row.sets,
          }))
        : [],
  }));

  return buildMuscleSnapshot({
    horizon_days: horizonDays,
    since,
    until,
    today: until,
    metaByExercise,
    sessions: sessionPayload,
    templateExerciseIds,
    planned_template_name: nextTemplate?.name ?? null,
    planned_exercise_ids: plannedExerciseIds,
  });
}

async function currentPhaseId(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return typeof result.data?.id === "string" ? result.data.id : null;
}

async function loadExerciseMuscleMeta(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, ExerciseMuscleMeta>> {
  const map = new Map<string, ExerciseMuscleMeta>();
  if (exerciseIds.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const exercises = await supabase
    .from("exercises")
    .select("id, name, short_name, catalog_exercise_id")
    .eq("user_id", userId)
    .in("id", exerciseIds);

  if (exercises.error) {
    throw exercises.error;
  }

  const catalogIds = [
    ...new Set(
      (exercises.data ?? [])
        .map((row) =>
          typeof row.catalog_exercise_id === "string"
            ? row.catalog_exercise_id
            : null,
        )
        .filter((id): id is string => id != null),
    ),
  ];

  const catalogById = new Map<
    string,
    {
      body_part: string | null;
      name_en: string;
      name_ru: string | null;
      equipment: string | null;
    }
  >();

  if (catalogIds.length > 0) {
    const catalog = await supabase
      .from("catalog_exercises")
      .select("id, body_part, name_en, name_ru, equipment")
      .in("id", catalogIds);

    if (catalog.error) {
      throw catalog.error;
    }

    for (const row of catalog.data ?? []) {
      catalogById.set(String(row.id), {
        body_part: typeof row.body_part === "string" ? row.body_part : null,
        name_en: String(row.name_en ?? ""),
        name_ru:
          typeof row.name_ru === "string" && row.name_ru.trim() !== ""
            ? row.name_ru
            : null,
        equipment: typeof row.equipment === "string" ? row.equipment : null,
      });
    }
  }

  for (const row of exercises.data ?? []) {
    const id = String(row.id);
    const displayName =
      typeof row.short_name === "string" && row.short_name.trim() !== ""
        ? row.short_name
        : String(row.name);
    const catalogId =
      typeof row.catalog_exercise_id === "string"
        ? row.catalog_exercise_id
        : null;
    const catalog = catalogId ? catalogById.get(catalogId) : null;
    map.set(id, {
      exercise_id: id,
      name: displayName,
      body_part: catalog?.body_part ?? null,
      name_en: catalog?.name_en ?? null,
      name_ru: catalog?.name_ru ?? String(row.name),
      equipment: catalog?.equipment ?? null,
    });
  }

  return map;
}
