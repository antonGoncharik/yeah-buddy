import { shiftIsoDate } from "@/lib/day/dates";
import { getUserCalendarToday } from "@/lib/day/writable";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MuscleSnapshot } from "@/lib/types";
import { calendarWeekStart } from "@/lib/workout/calendar-week";
import {
  buildMuscleSnapshot,
  type ExerciseMuscleMeta,
  parseMuscleHorizonDays,
} from "@/lib/workout/muscle-aggregate";
import { getNextTemplate } from "@/lib/workout/rotation";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import { templateNamesById } from "@/lib/workout/session-names";
import { listTemplateExerciseMap } from "@/lib/workout/template-exercises";

export { parseMuscleHorizonDays };

export async function getMuscleSnapshot(
  userId: string,
  horizonDays: number,
  options?: { calendarWeek?: boolean },
): Promise<MuscleSnapshot> {
  const until = await getUserCalendarToday(userId);
  const since =
    options?.calendarWeek && horizonDays === 7
      ? calendarWeekStart(until)
      : shiftIsoDate(until, 1 - horizonDays);
  const settings = await getUserSettings(userId);

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

  const [templateMap, macroPhaseId, templateNames] = await Promise.all([
    listTemplateExerciseMap(userId, templateIds),
    currentPhaseId(userId),
    templateNamesById(userId, templateIds),
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
    template_name:
      session.template_id != null
        ? (templateNames.get(session.template_id) ?? null)
        : null,
    exercises:
      session.status === "completed"
        ? (workBySession.get(session.session_id) ?? []).map((row) => ({
            exercise_id: row.exercise_id,
            sets: row.sets,
          }))
        : [],
  }));

  return {
    ...buildMuscleSnapshot({
      horizon_days: horizonDays,
      since,
      until,
      today: until,
      metaByExercise,
      sessions: sessionPayload,
      templateExerciseIds,
      planned_template_name: nextTemplate?.name ?? null,
      planned_exercise_ids: plannedExerciseIds,
    }),
    figure_sex: settings?.sex ?? null,
  };
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

export async function loadExerciseMuscleMeta(
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
      source_exercise_id: string;
      body_part: string | null;
      name_en: string;
      name_ru: string | null;
      equipment: string | null;
      target: string | null;
      secondary_muscles: string[] | null;
    }
  >();

  if (catalogIds.length > 0) {
    const catalog = await supabase
      .from("catalog_exercises")
      .select(
        "id, source_exercise_id, body_part, name_en, name_ru, equipment, target, secondary_muscles",
      )
      .in("id", catalogIds);

    if (catalog.error) {
      throw catalog.error;
    }

    for (const row of catalog.data ?? []) {
      catalogById.set(String(row.id), {
        source_exercise_id: String(row.source_exercise_id ?? ""),
        body_part: typeof row.body_part === "string" ? row.body_part : null,
        name_en: String(row.name_en ?? ""),
        name_ru:
          typeof row.name_ru === "string" && row.name_ru.trim() !== ""
            ? row.name_ru
            : null,
        equipment: typeof row.equipment === "string" ? row.equipment : null,
        target: typeof row.target === "string" ? row.target : null,
        secondary_muscles: parseSecondaryMusclesRow(row.secondary_muscles),
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
      source_exercise_id:
        catalog?.source_exercise_id && catalog.source_exercise_id !== ""
          ? catalog.source_exercise_id
          : null,
      target: catalog?.target ?? null,
      secondary_muscles: catalog?.secondary_muscles ?? null,
    });
  }

  return map;
}

function parseSecondaryMusclesRow(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const list = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return list.length > 0 ? list : [];
}
