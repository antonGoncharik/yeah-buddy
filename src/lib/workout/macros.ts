import { z } from "zod";

import { isIsoDate } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrentMacroState,
  CycleStatus,
  MacroCycle,
  MaxSource,
  PhaseMax,
  PhaseMaxRow,
  PhaseType,
  TransitionPreview,
  WorkoutPhase,
} from "@/lib/types";
import { listExercises, raiseGlobalMax } from "@/lib/workout/exercises";
import {
  increaseMax,
  nextPhaseType,
  shouldIncreaseMax,
} from "@/lib/workout/formulas";
import { PHASE_ORDER } from "@/lib/workout/labels";
import { toNullableString, toNumber } from "@/lib/workout/numbers";
import { getPhaseCircleProgress } from "@/lib/workout/phase-progress";

export class MacroConflictError extends Error {
  readonly code = "MACRO_EXISTS";

  constructor() {
    super("Текущий макроцикл уже есть.");
  }
}

export class NoExercisesError extends Error {
  constructor() {
    super("Сначала добавьте упражнения.");
  }
}

const maxInputSchema = z.object({
  exercise_id: z.string().uuid(),
  max_weight: z.number().finite().positive(),
});

export const createMacroSchema = z.object({
  start_date: z.string().refine(isIsoDate, "Некорректная дата."),
  note: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }),
  maxes: z.array(maxInputSchema).min(1),
});

export const phaseMaxInputSchema = maxInputSchema;

export const confirmTransitionSchema = z.object({
  end_date: z.string().refine(isIsoDate, "Некорректная дата."),
  maxes: z.array(maxInputSchema).min(1),
});

export type CreateMacroInput = z.infer<typeof createMacroSchema>;
export type ConfirmTransitionInput = z.infer<typeof confirmTransitionSchema>;

export async function getCurrentMacroState(
  userId: string,
): Promise<CurrentMacroState> {
  const supabase = createSupabaseServerClient();
  const macros = await supabase
    .from("macro_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (macros.error) {
    throw macros.error;
  }

  if (!macros.data) {
    return {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      phase_circle: null,
    };
  }

  const macro = mapMacroCycle(macros.data as Record<string, unknown>);
  const phasesResult = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macro.id)
    .order("sort_order", { ascending: true });

  if (phasesResult.error) {
    throw phasesResult.error;
  }

  const phases = (phasesResult.data ?? []).map((row) =>
    mapWorkoutPhase(row as Record<string, unknown>),
  );
  const phase = phases.find((item) => item.status === "current") ?? null;
  const maxes = phase ? await listPhaseMaxRows(userId, phase.id) : [];
  const phase_circle = await getPhaseCircleProgress(userId, phase);

  return { macro, phase, phases, maxes, phase_circle };
}

export async function createFirstMacro(
  userId: string,
  input: CreateMacroInput,
): Promise<CurrentMacroState> {
  const current = await getCurrentMacroState(userId);
  if (current.macro) {
    throw new MacroConflictError();
  }

  const exercises = await listExercises(userId, "active");
  if (exercises.length === 0) {
    throw new NoExercisesError();
  }

  const maxByExercise = new Map(
    input.maxes.map((item) => [item.exercise_id, item.max_weight]),
  );
  for (const exercise of exercises) {
    if (!maxByExercise.has(exercise.id)) {
      throw new Error("Задайте максимум для каждого упражнения.");
    }
  }

  const supabase = createSupabaseServerClient();
  const last = await supabase
    .from("macro_cycles")
    .select("number")
    .eq("user_id", userId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last.error) {
    throw last.error;
  }

  const nextNumber =
    last.data && typeof last.data.number === "number"
      ? last.data.number + 1
      : 1;

  const createdMacro = await supabase
    .from("macro_cycles")
    .insert({
      user_id: userId,
      number: nextNumber,
      start_date: input.start_date,
      status: "current",
      note: input.note,
    })
    .select("*")
    .single();

  if (createdMacro.error || !createdMacro.data) {
    if (createdMacro.error?.code === "23505") {
      throw new MacroConflictError();
    }
    throw createdMacro.error ?? new Error("Macro insert failed");
  }

  const macro = mapMacroCycle(createdMacro.data as Record<string, unknown>);
  await createPhase(userId, {
    macroId: macro.id,
    phaseType: "ramp",
    startDate: input.start_date,
    maxes: exercises.map((exercise) => ({
      exercise_id: exercise.id,
      max_weight: maxByExercise.get(exercise.id) ?? 0,
      source: "manual" as const,
    })),
  });

  return getCurrentMacroState(userId);
}

export async function setPhaseMax(
  userId: string,
  phaseId: string,
  input: { exercise_id: string; max_weight: number },
): Promise<PhaseMax> {
  const phase = await getOwnedPhase(userId, phaseId);
  if (!phase) {
    throw new Error("Фаза не найдена.");
  }

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("phase_maxes")
    .insert({
      user_id: userId,
      phase_id: phaseId,
      exercise_id: input.exercise_id,
      max_weight: input.max_weight,
      source: "manual",
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Phase max insert failed");
  }

  return mapPhaseMax(inserted.data as Record<string, unknown>);
}

export async function listCurrentPhaseMaxes(
  userId: string,
  phaseId: string,
): Promise<Map<string, PhaseMax>> {
  const rows = await listPhaseMaxRows(userId, phaseId);
  return new Map(
    rows.flatMap((row) =>
      row.phase_max ? [[row.exercise.id, row.phase_max] as const] : [],
    ),
  );
}

export async function previewTransition(
  userId: string,
): Promise<TransitionPreview> {
  const state = await getCurrentMacroState(userId);
  if (!state.macro || !state.phase) {
    throw new Error("Нет текущей фазы.");
  }

  const settings = await ensureWorkoutSettings(userId);
  const nextType = nextPhaseType(state.phase.phase_type);

  if (!nextType) {
    const peak = await getPeakPhaseMaxes(userId, state.macro.id);
    const source = peak.some((row) => row.phase_max) ? peak : state.maxes;
    return {
      from_phase: state.phase.phase_type,
      to_phase: null,
      new_macro: true,
      increased: false,
      maxes: toTransitionMaxes(source, (weight) => weight),
    };
  }

  const increased = shouldIncreaseMax(state.phase.phase_type, nextType);
  return {
    from_phase: state.phase.phase_type,
    to_phase: nextType,
    new_macro: false,
    increased,
    maxes: toTransitionMaxes(state.maxes, (weight, step) =>
      increased
        ? increaseMax(weight, settings.max_increase_percent, step)
        : weight,
    ),
  };
}

export async function confirmTransition(
  userId: string,
  input: ConfirmTransitionInput,
): Promise<CurrentMacroState> {
  const preview = await previewTransition(userId);
  if (preview.new_macro) {
    return completeMacroAndStartNext(userId, {
      start_date: input.end_date,
      note: null,
      maxes: input.maxes,
    });
  }

  const state = await getCurrentMacroState(userId);
  if (!state.macro || !state.phase || !preview.to_phase) {
    throw new Error("Нет текущей фазы.");
  }

  const supabase = createSupabaseServerClient();
  const closed = await supabase
    .from("workout_phases")
    .update({
      status: "completed",
      end_date: input.end_date,
    })
    .eq("id", state.phase.id)
    .eq("user_id", userId)
    .eq("status", "current");

  if (closed.error) {
    throw closed.error;
  }

  await createPhase(userId, {
    macroId: state.macro.id,
    phaseType: preview.to_phase,
    startDate: input.end_date,
    maxes: input.maxes.map((item) => ({
      exercise_id: item.exercise_id,
      max_weight: item.max_weight,
      source: preview.increased ? "auto" : "auto",
    })),
  });

  return getCurrentMacroState(userId);
}

function toTransitionMaxes(
  rows: PhaseMaxRow[],
  propose: (current: number, step: number) => number,
): TransitionPreview["maxes"] {
  return rows.flatMap((row) => {
    if (!row.phase_max) {
      return [];
    }

    return [
      {
        exercise_id: row.exercise.id,
        name: row.exercise.short_name || row.exercise.name,
        current_weight: row.phase_max.max_weight,
        proposed_weight: propose(
          row.phase_max.max_weight,
          row.exercise.weight_step,
        ),
      },
    ];
  });
}

export async function getPeakPhaseMaxes(
  userId: string,
  macroId: string,
): Promise<PhaseMaxRow[]> {
  const supabase = createSupabaseServerClient();
  const peak = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macroId)
    .eq("phase_type", "peak")
    .maybeSingle();

  if (peak.error) {
    throw peak.error;
  }

  if (!peak.data) {
    return [];
  }

  return listPhaseMaxRows(userId, String(peak.data.id));
}

export async function completeMacroAndStartNext(
  userId: string,
  input: CreateMacroInput,
): Promise<CurrentMacroState> {
  const current = await getCurrentMacroState(userId);
  if (!current.macro || !current.phase) {
    throw new Error("Нет текущего макроцикла.");
  }

  if (current.phase.phase_type !== "deload") {
    throw new Error("Новый макроцикл начинается после сброса.");
  }

  const supabase = createSupabaseServerClient();
  const closedPhase = await supabase
    .from("workout_phases")
    .update({
      status: "completed",
      end_date: input.start_date,
    })
    .eq("id", current.phase.id)
    .eq("user_id", userId)
    .eq("status", "current");

  if (closedPhase.error) {
    throw closedPhase.error;
  }

  const closedMacro = await supabase
    .from("macro_cycles")
    .update({
      status: "completed",
      end_date: input.start_date,
    })
    .eq("id", current.macro.id)
    .eq("user_id", userId)
    .eq("status", "current");

  if (closedMacro.error) {
    throw closedMacro.error;
  }

  return createFirstMacro(userId, input);
}

export function mapMacroCycle(row: Record<string, unknown>): MacroCycle {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    number: toNumber(row.number),
    start_date: String(row.start_date).slice(0, 10),
    end_date: toNullableString(row.end_date)?.slice(0, 10) ?? null,
    status: toCycleStatus(row.status),
    note: toNullableString(row.note),
    created_at: String(row.created_at),
  };
}

export function mapWorkoutPhase(row: Record<string, unknown>): WorkoutPhase {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    macro_cycle_id: String(row.macro_cycle_id),
    phase_type: toPhaseType(row.phase_type),
    start_date: String(row.start_date).slice(0, 10),
    end_date: toNullableString(row.end_date)?.slice(0, 10) ?? null,
    status: toCycleStatus(row.status),
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
  };
}

export function mapPhaseMax(row: Record<string, unknown>): PhaseMax {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    phase_id: String(row.phase_id),
    exercise_id: String(row.exercise_id),
    max_weight: toNumber(row.max_weight),
    source: toMaxSource(row.source),
    set_at: String(row.set_at),
    created_at: String(row.created_at),
  };
}

async function createPhase(
  userId: string,
  input: {
    macroId: string;
    phaseType: PhaseType;
    startDate: string;
    maxes: Array<{
      exercise_id: string;
      max_weight: number;
      source: MaxSource;
    }>;
  },
): Promise<WorkoutPhase> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("workout_phases")
    .insert({
      user_id: userId,
      macro_cycle_id: input.macroId,
      phase_type: input.phaseType,
      start_date: input.startDate,
      status: "current",
      sort_order: PHASE_ORDER[input.phaseType],
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Phase insert failed");
  }

  const phase = mapWorkoutPhase(inserted.data as Record<string, unknown>);
  if (input.maxes.length > 0) {
    const maxInsert = await supabase.from("phase_maxes").insert(
      input.maxes.map((item) => ({
        user_id: userId,
        phase_id: phase.id,
        exercise_id: item.exercise_id,
        max_weight: item.max_weight,
        source: item.source,
      })),
    );

    if (maxInsert.error) {
      throw maxInsert.error;
    }

    for (const item of input.maxes) {
      await raiseGlobalMax({
        userId,
        exerciseId: item.exercise_id,
        maxWeight: item.max_weight,
        achievedAt: input.startDate,
        phaseId: phase.id,
      });
    }
  }

  return phase;
}

async function listPhaseMaxRows(
  userId: string,
  phaseId: string,
): Promise<PhaseMaxRow[]> {
  const exercises = await listExercises(userId, "active");
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("phase_maxes")
    .select("*")
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .order("set_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  const latest = new Map<string, PhaseMax>();
  for (const row of result.data ?? []) {
    const record = mapPhaseMax(row as Record<string, unknown>);
    if (!latest.has(record.exercise_id)) {
      latest.set(record.exercise_id, record);
    }
  }

  return exercises.map((exercise) => ({
    exercise,
    phase_max: latest.get(exercise.id) ?? null,
    proposed_weight: latest.get(exercise.id)?.max_weight ?? null,
  }));
}

async function getOwnedPhase(
  userId: string,
  phaseId: string,
): Promise<WorkoutPhase | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapWorkoutPhase(result.data as Record<string, unknown>);
}

function toCycleStatus(value: unknown): CycleStatus {
  return value === "completed" ? "completed" : "current";
}

function toPhaseType(value: unknown): PhaseType {
  if (
    value === "ramp" ||
    value === "volume" ||
    value === "peak" ||
    value === "deload"
  ) {
    return value;
  }

  return "ramp";
}

function toMaxSource(value: unknown): MaxSource {
  return value === "auto" ? "auto" : "manual";
}
