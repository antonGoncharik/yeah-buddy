import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentMacroState, TransitionPreview } from "@/lib/types";
import {
  cycleDef,
  isLastCyclePhase,
  sortOrderForPhase,
} from "@/lib/workout/cycle";
import { bumpTracksByKg } from "@/lib/workout/exercise-tracks";
import {
  increaseMax,
  nextPhaseType,
  shouldIncreaseMax,
} from "@/lib/workout/formulas";
import { phaseLabel } from "@/lib/workout/labels";
import {
  createFirstMacro,
  createPhase,
  startingPhaseMaxes,
} from "@/lib/workout/macro-create";
import type {
  ConfirmTransitionInput,
  CreateMacroInput,
} from "@/lib/workout/macro-schema";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import {
  getRecapEndMaxes,
  toTransitionMaxes,
} from "@/lib/workout/macro-transition-maxes";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { exerciseIdsNeedingTrack } from "@/lib/workout/slot-plan";
import { listActiveTemplates } from "@/lib/workout/template-store";

export async function previewTransition(
  userId: string,
): Promise<TransitionPreview> {
  const state = await getCurrentMacroState(userId);
  if (!state.macro || !state.phase) {
    throw new Error("Нет текущего этапа.");
  }

  const settings = await ensureWorkoutSettings(userId);
  const cycle = settings.formulas.cycle;
  const loop = settings.formulas.cycle_loop === true;
  const nextType = nextPhaseType(state.phase.phase_type, cycle, loop);
  const fromName = phaseLabel(state.phase.phase_type, state.phase.name);
  const holdWeights = state.phase_circle?.hold_weights === true;
  const increased =
    !holdWeights && shouldIncreaseMax(state.phase.phase_type, nextType, cycle);
  const kgIncrease = holdWeights
    ? 0
    : (cycleDef(cycle, state.phase.phase_type)?.kg_increase_on_end ?? 0);

  if (!nextType) {
    const peak = await getRecapEndMaxes(userId, state.macro.id, cycle);
    const source = peak.some((row) => row.phase_max) ? peak : state.maxes;
    return {
      from_phase: state.phase.phase_type,
      to_phase: null,
      from_name: fromName,
      to_name: null,
      new_macro: true,
      increased,
      kg_increase: kgIncrease,
      hold_weights: holdWeights,
      maxes: toTransitionMaxes(source, (weight, step) =>
        increased
          ? increaseMax(weight, settings.max_increase_percent, step)
          : weight,
      ),
    };
  }
  return {
    from_phase: state.phase.phase_type,
    to_phase: nextType,
    from_name: fromName,
    to_name: phaseLabel(nextType, cycleDef(cycle, nextType)?.name),
    new_macro: false,
    increased,
    kg_increase: kgIncrease,
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

  await applyEndedPhaseKg(userId, preview);

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

  // Validate weights before closing anything, so a bad payload cannot leave
  // the user with a closed cycle and no new one.
  await startingPhaseMaxes(userId, input.maxes);

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

  await applyEndedPhaseKg(userId, {
    hold_weights: current.phase_circle?.hold_weights === true,
    kg_increase:
      cycleDef(settings.formulas.cycle, current.phase.phase_type)
        ?.kg_increase_on_end ?? 0,
  });

  return createFirstMacro(userId, input);
}

async function applyEndedPhaseKg(
  userId: string,
  preview: Pick<TransitionPreview, "hold_weights" | "kg_increase">,
): Promise<void> {
  if (preview.hold_weights || !(preview.kg_increase > 0)) {
    return;
  }
  const templates = await listActiveTemplates(userId);
  await bumpTracksByKg(
    userId,
    [...exerciseIdsNeedingTrack(templates)],
    preview.kg_increase,
  );
}
