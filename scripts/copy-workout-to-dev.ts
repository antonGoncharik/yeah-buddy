import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormulaSetSpec } from "@/lib/types";
import { specForPhase } from "@/lib/workout/cycle";
import { calcPlannedWeight } from "@/lib/workout/formulas";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { parseFormulas } from "@/lib/workout/parse-formulas";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { plannedTestMax } from "@/lib/workout/test-raise";

const DEV_TELEGRAM_ID = -1;

const WIPE_ORDER = [
  "workout_sets",
  "session_exercises",
  "workout_sessions",
  "phase_maxes",
  "global_maxes",
  "workout_phases",
  "macro_cycles",
  "workout_template_exercises",
  "workout_templates",
  "exercise_tracks",
  "exercises",
  "workout_settings",
] as const;

function reps(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: count, seconds: null };
}

function holds(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: null, seconds: count };
}

function applyV2(formulas: WorkoutFormulas): WorkoutFormulas {
  const next = structuredClone(formulas);
  const week = (name: string, key: string) =>
    next.cycle.find((phase) => phase.name === name || phase.key === key);
  const ramp = week("Разгон", "ramp");
  const volume = week("Набор", "volume");
  const peak = week("Рывок", "peak");
  const deload = week("Сброс", "deload");
  if (!ramp || !volume || !peak || !deload) {
    throw new Error(
      `cycle weeks missing: ${next.cycle.map((phase) => phase.name).join(", ")}`,
    );
  }

  volume.increase_on_end = true;
  volume.raise_from_test = true;
  deload.skip_warmup = false;

  const dynamic: Array<[typeof ramp, FormulaSetSpec[]]> = [
    [ramp, [reps(85, 3), reps(80, 5), reps(80, 5)]],
    [volume, [reps(88, 5), reps(80, 5), reps(80, 5)]],
    [peak, [reps(90, 2), reps(85, 3), reps(80, 5)]],
    [deload, [reps(70, 3), reps(70, 3)]],
  ];
  const stat: Array<[typeof ramp, FormulaSetSpec[]]> = [
    [ramp, [holds(115, 6), holds(115, 6), holds(115, 6)]],
    [volume, [holds(115, 8), holds(115, 6), holds(115, 6)]],
    [peak, [holds(115, 6), holds(115, 6), holds(115, 6)]],
    [deload, [holds(100, 3), holds(100, 3)]],
  ];
  for (const [phase, work] of dynamic) {
    next.dynamic.phases[phase.key] = { warmup: [], work };
  }
  for (const [phase, work] of stat) {
    next.static.phases[phase.key] = { warmup: [], work };
  }
  next.dynamic.base = { warmup: [], work: dynamic[0]?.[1] ?? [] };
  next.static.base = { warmup: [], work: stat[0]?.[1] ?? [] };
  return next;
}

async function main() {
  const source = await findSource();
  const destId = await ensureDevUser();
  if (destId === source.id) {
    throw new Error("refusing to copy a user onto itself");
  }

  console.log(
    `copy workouts ${source.username ?? source.id} → dev (${destId})`,
  );
  await wipe(destId);
  await copyWorkouts(source.id, destId);
  await dropPlannedSets(destId);
  console.log("copied. source account was not written.");
  await printCheck(destId);
}

async function findSource(): Promise<{ id: string; username: string | null }> {
  const supabase = createSupabaseServerClient();
  const listed = await supabase
    .from("users")
    .select("id, username, telegram_id")
    .ilike("username", "%goncharik%");
  if (listed.error) {
    throw listed.error;
  }
  const rows = (listed.data ?? []).filter(
    (row) => row.telegram_id !== DEV_TELEGRAM_ID,
  );
  const match =
    rows.find((row) => row.username === "antonGoncharik") ?? rows[0];
  if (!match || typeof match.id !== "string") {
    throw new Error("source user not found");
  }
  return { id: match.id, username: match.username };
}

async function ensureDevUser(): Promise<string> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", DEV_TELEGRAM_ID)
    .maybeSingle();
  if (existing.error) {
    throw existing.error;
  }
  if (existing.data && typeof existing.data.id === "string") {
    return existing.data.id;
  }

  const inserted = await supabase
    .from("users")
    .insert({
      telegram_id: DEV_TELEGRAM_ID,
      username: "dev",
      first_name: "Dev",
      language_code: "ru",
    })
    .select("id")
    .single();
  if (inserted.error || typeof inserted.data?.id !== "string") {
    throw inserted.error ?? new Error("dev user was not created");
  }
  return inserted.data.id;
}

async function wipe(userId: string) {
  const supabase = createSupabaseServerClient();
  for (const table of WIPE_ORDER) {
    const result = await supabase.from(table).delete().eq("user_id", userId);
    if (result.error) {
      throw new Error(`${table}: ${result.error.message}`);
    }
  }
}

async function copyWorkouts(sourceId: string, destId: string) {
  const exercises = await fetchAll("exercises", sourceId);
  const tracks = await fetchAll("exercise_tracks", sourceId);
  const templates = await fetchAll("workout_templates", sourceId);
  const templateExercises = await fetchAll(
    "workout_template_exercises",
    sourceId,
  );
  const macros = await fetchAll("macro_cycles", sourceId);
  const phases = await fetchAll("workout_phases", sourceId);
  const phaseMaxes = await fetchAll("phase_maxes", sourceId);
  const sessions = await fetchAll("workout_sessions", sourceId);
  const sessionExercises = await fetchAll("session_exercises", sourceId);
  const sets = await fetchAll("workout_sets", sourceId);
  const globalMaxes = await fetchAll("global_maxes", sourceId);
  const settings = await fetchAll("workout_settings", sourceId);

  const exerciseIds = idsOf(exercises);
  const trackIds = idsOf(tracks);
  const templateIds = idsOf(templates);
  const templateExerciseIds = idsOf(templateExercises);
  const macroIds = idsOf(macros);
  const phaseIds = idsOf(phases);
  const phaseMaxIds = idsOf(phaseMaxes);
  const sessionIds = idsOf(sessions);
  const sessionExerciseIds = idsOf(sessionExercises);
  const setIds = idsOf(sets);
  const globalMaxIds = idsOf(globalMaxes);

  await insertAll(
    "exercises",
    exercises.map((row) => ({
      ...row,
      id: mustMap(exerciseIds, row.id, "exercise"),
      user_id: destId,
    })),
  );
  await insertAll(
    "exercise_tracks",
    tracks.map((row) => ({
      ...row,
      id: mustMap(trackIds, row.id, "track"),
      user_id: destId,
      exercise_id: mustMap(exerciseIds, row.exercise_id, "track exercise"),
    })),
  );
  await insertAll(
    "workout_templates",
    templates.map((row) => ({
      ...row,
      id: mustMap(templateIds, row.id, "template"),
      user_id: destId,
    })),
  );
  await insertAll(
    "workout_template_exercises",
    templateExercises.map((row) => ({
      ...row,
      id: mustMap(templateExerciseIds, row.id, "template exercise"),
      user_id: destId,
      template_id: mustMap(templateIds, row.template_id, "template"),
      exercise_id: mustMap(exerciseIds, row.exercise_id, "template exercise"),
    })),
  );
  await insertAll(
    "macro_cycles",
    macros.map((row) => ({
      ...row,
      id: mustMap(macroIds, row.id, "macro"),
      user_id: destId,
    })),
  );
  await insertAll(
    "workout_phases",
    phases.map((row) => ({
      ...row,
      id: mustMap(phaseIds, row.id, "phase"),
      user_id: destId,
      macro_cycle_id: mustMap(macroIds, row.macro_cycle_id, "phase macro"),
    })),
  );
  await insertAll(
    "phase_maxes",
    phaseMaxes.map((row) => ({
      ...row,
      id: mustMap(phaseMaxIds, row.id, "phase max"),
      user_id: destId,
      phase_id: mustMap(phaseIds, row.phase_id, "phase max phase"),
      exercise_id: mustMap(exerciseIds, row.exercise_id, "phase max exercise"),
    })),
  );
  await insertAll(
    "workout_sessions",
    sessions.map((row) => ({
      ...row,
      id: mustMap(sessionIds, row.id, "session"),
      user_id: destId,
      macro_cycle_id: optionalMap(macroIds, row.macro_cycle_id),
      phase_id: optionalMap(phaseIds, row.phase_id),
      template_id: optionalMap(templateIds, row.template_id),
    })),
  );
  await insertAll(
    "session_exercises",
    sessionExercises.map((row) => ({
      ...row,
      id: mustMap(sessionExerciseIds, row.id, "session exercise"),
      user_id: destId,
      session_id: mustMap(sessionIds, row.session_id, "session"),
      exercise_id: mustMap(exerciseIds, row.exercise_id, "session exercise"),
    })),
  );
  await insertAll(
    "workout_sets",
    sets.map((row) => ({
      ...row,
      id: mustMap(setIds, row.id, "set"),
      user_id: destId,
      session_exercise_id: mustMap(
        sessionExerciseIds,
        row.session_exercise_id,
        "set session exercise",
      ),
    })),
  );
  await insertAll(
    "global_maxes",
    globalMaxes.map((row) => ({
      ...row,
      id: mustMap(globalMaxIds, row.id, "global max"),
      user_id: destId,
      exercise_id: mustMap(exerciseIds, row.exercise_id, "global max exercise"),
      phase_id: optionalMap(phaseIds, row.phase_id),
      workout_session_id: optionalMap(sessionIds, row.workout_session_id),
    })),
  );

  const settingsRow = settings[0];
  if (!settingsRow) {
    throw new Error("source has no workout settings");
  }
  const formulas = applyV2(parseFormulas(settingsRow.formulas));
  const saved = await createSupabaseServerClient()
    .from("workout_settings")
    .insert({
      ...settingsRow,
      user_id: destId,
      formulas,
      skip_template_ids: remapUuidList(
        templateIds,
        settingsRow.skip_template_ids,
      ),
    });
  if (saved.error) {
    throw new Error(`workout_settings: ${saved.error.message}`);
  }

  console.log(
    `exercises ${exercises.length}, sessions ${sessions.length}, sets ${sets.length}`,
  );
}

async function dropPlannedSets(userId: string) {
  const supabase = createSupabaseServerClient();
  const planned = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "planned");
  if (planned.error) {
    throw planned.error;
  }
  const sessionIds = (planned.data ?? []).map((row) => String(row.id));
  if (sessionIds.length === 0) {
    return;
  }
  const exercises = await supabase
    .from("session_exercises")
    .select("id")
    .eq("user_id", userId)
    .in("session_id", sessionIds);
  if (exercises.error) {
    throw exercises.error;
  }
  const exerciseIds = (exercises.data ?? []).map((row) => String(row.id));
  if (exerciseIds.length > 0) {
    const sets = await supabase
      .from("workout_sets")
      .delete()
      .eq("user_id", userId)
      .in("session_exercise_id", exerciseIds);
    if (sets.error) {
      throw sets.error;
    }
    const removed = await supabase
      .from("session_exercises")
      .delete()
      .eq("user_id", userId)
      .in("id", exerciseIds);
    if (removed.error) {
      throw removed.error;
    }
  }
  console.log(`cleared ${sessionIds.length} planned sessions so they replan`);
}

async function printCheck(userId: string) {
  const state = await getCurrentMacroState(userId);
  const settings = await ensureWorkoutSettings(userId);
  console.log(
    `dev macro ${state.macro?.number ?? "?"} phase ${state.phase?.name ?? "none"}`,
  );
  const squat = state.maxes.find((row) =>
    row.exercise.name.toLowerCase().includes("присед"),
  );
  if (!squat?.phase_max || !state.phase) {
    console.log("squat max not on the current phase");
    return;
  }
  const max = squat.phase_max.max_weight;
  const step = squat.exercise.weight_step;
  const work = specForPhase(
    settings.formulas,
    "dynamic",
    state.phase.phase_type,
  );
  console.log(
    `squat ${max} on ${state.phase.phase_type}: ${work.work
      .map((set) => calcPlannedWeight(max, set.percent, step))
      .join(", ")}`,
  );
  const raised = plannedTestMax({
    maxKg: max,
    stepKg: step,
    kind: "dynamic",
    work: specForPhase(settings.formulas, "dynamic", "volume").work,
  });
  const peak = specForPhase(settings.formulas, "dynamic", "peak");
  console.log(
    `squat if the test is made: ${raised}; peak ${
      raised == null
        ? "n/a"
        : peak.work
            .map((set) => calcPlannedWeight(raised, set.percent, step))
            .join(", ")
    }`,
  );
}

async function fetchAll(
  table: string,
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const supabase = createSupabaseServerClient();
  const rows: Array<Record<string, unknown>> = [];
  const page = 500;
  for (let from = 0; ; from += page) {
    const result = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .range(from, from + page - 1);
    if (result.error) {
      throw new Error(`${table}: ${result.error.message}`);
    }
    const batch = (result.data ?? []) as Array<Record<string, unknown>>;
    rows.push(...batch);
    if (batch.length < page) {
      return rows;
    }
  }
}

async function insertAll(table: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return;
  }
  const supabase = createSupabaseServerClient();
  const page = 200;
  for (let index = 0; index < rows.length; index += page) {
    const result = await supabase
      .from(table)
      .insert(rows.slice(index, index + page));
    if (result.error) {
      throw new Error(`${table}: ${result.error.message}`);
    }
  }
}

function idsOf(rows: Array<Record<string, unknown>>): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(String(row.id), crypto.randomUUID());
  }
  return map;
}

function mustMap(
  map: Map<string, string>,
  value: unknown,
  label: string,
): string {
  const next = map.get(String(value));
  if (!next) {
    throw new Error(`missing ${label}: ${String(value)}`);
  }
  return next;
}

function optionalMap(map: Map<string, string>, value: unknown): string | null {
  if (value == null) {
    return null;
  }
  return map.get(String(value)) ?? null;
}

function remapUuidList(map: Map<string, string>, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((id) => {
    const next = map.get(String(id));
    return next ? [next] : [];
  });
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
