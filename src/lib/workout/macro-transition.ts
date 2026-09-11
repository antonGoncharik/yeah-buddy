import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrentMacroState,
  CyclePhaseDef,
  PhaseMaxRow,
  TransitionPreview,
} from "@/lib/types";
import {
  cycleDef,
  isLastCyclePhase,
  recapEndPhaseKey,
  sortOrderForPhase,
} from "@/lib/workout/cycle";
import {
  increaseMax,
  nextPhaseType,
  shouldIncreaseMax,
} from "@/lib/workout/formulas";
import { phaseLabel } from "@/lib/workout/labels";
import { createFirstMacro, createPhase } from "@/lib/workout/macro-create";
import { listPhaseMaxRows } from "@/lib/workout/macro-maxes";
import type {
  ConfirmTransitionInput,
  CreateMacroInput,
} from "@/lib/workout/macro-schema";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { mapWorkoutPhase } from "@/lib/workout/map-rows";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export async function previewTransition(
  userId: string,
): Promise<TransitionPreview> {
  const state = await getCurrentMacroState(userId);
  if (!state.macro || !state.phase) {
    throw new Error("Нет текущего этапа.");
  }

  const settings = await ensureWorkoutSettings(userId);
  const cycle = settings.formulas.cycle;
  const nextType = nextPhaseType(state.phase.phase_type, cycle);
  const fromName = phaseLabel(state.phase.phase_type, state.phase.name);

  if (!nextType) {
    const peak = await getRecapEndMaxes(userId, state.macro.id, cycle);
    const source = peak.some((row) => row.phase_max) ? peak : state.maxes;
    return {
      from_phase: state.phase.phase_type,
      to_phase: null,
      from_name: fromName,
      to_name: null,
      new_macro: true,
      increased: false,
      hold_weights: state.phase_circle?.hold_weights === true,
      maxes: toTransitionMaxes(source, (weight) => weight),
    };
  }

  const holdWeights = state.phase_circle?.hold_weights === true;
  const increased =
    !holdWeights && shouldIncreaseMax(state.phase.phase_type, nextType, cycle);
  return {
    from_phase: state.phase.phase_type,
    to_phase: nextType,
    from_name: fromName,
    to_name: phaseLabel(nextType, cycleDef(cycle, nextType)?.name),
    new_macro: false,
    increased,
    hold_weights: holdWeights,
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
    throw new Error("Нет текущего этапа.");
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

  const settings = await ensureWorkoutSettings(userId);
  const nextName =
    cycleDef(settings.formulas.cycle, preview.to_phase)?.name ?? null;

  await createPhase(userId, {
    macroId: state.macro.id,
    phaseType: preview.to_phase,
    name: nextName,
    sortOrder: sortOrderForPhase(
      preview.to_phase,
      settings.formulas.cycle,
      state.phases.length + 1,
    ),
    startDate: input.end_date,
    maxes: input.maxes.map((item) => ({
      exercise_id: item.exercise_id,
      max_weight: item.max_weight,
      source: preview.increased ? "auto" : "auto",
    })),
  });

  return getCurrentMacroState(userId);
}

export async function completeMacroAndStartNext(
  userId: string,
  input: CreateMacroInput,
): Promise<CurrentMacroState> {
  const current = await getCurrentMacroState(userId);
  if (!current.macro || !current.phase) {
    throw new Error("Нет текущего цикла.");
  }

  const settings = await ensureWorkoutSettings(userId);
  if (!isLastCyclePhase(current.phase.phase_type, settings.formulas.cycle)) {
    throw new Error("Новый цикл начинается после последнего этапа.");
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

async function getRecapEndMaxes(
  userId: string,
  macroId: string,
  cycle: CyclePhaseDef[],
): Promise<PhaseMaxRow[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macroId)
    .order("sort_order", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  const phases = (result.data ?? []).map((row) =>
    mapWorkoutPhase(row as Record<string, unknown>),
  );
  const endKey = recapEndPhaseKey(
    cycle,
    phases.map((phase) => phase.phase_type),
  );
  const end =
    phases.find((phase) => phase.phase_type === endKey) ?? phases.at(-1);
  if (!end) {
    return [];
  }

  return listPhaseMaxRows(userId, end.id);
}
