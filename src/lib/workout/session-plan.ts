import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  ExerciseTrack,
  SlotPlan,
  WorkoutFormulas,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { listTracksByExercise } from "@/lib/workout/exercise-tracks";
import { listExercises } from "@/lib/workout/exercises";
import { listCurrentPhaseMaxes } from "@/lib/workout/macros";
import { mapSessionExercise } from "@/lib/workout/map-rows";
import { loadLastWorkWeights } from "@/lib/workout/session-last-weights";
import { getPhase } from "@/lib/workout/session-work-load";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  plannedSetsForSlot,
  slotFor,
  slotNeedsFeel,
  slotNeedsMax,
  slotNeedsTrack,
} from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export interface PlanContext {
  formulas: WorkoutFormulas;
  phaseKey: string | null;
  maxByExercise: Map<string, number>;
  trackByExercise: Map<string, ExerciseTrack>;
  feelWeightByExercise: Map<string, number>;
}

export async function ensureSessionPlan(
  userId: string,
  session: WorkoutSession,
) {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("session_exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("session_id", session.id)
    .limit(1);

  if (existing.error) {
    throw existing.error;
  }

  if ((existing.data ?? []).length > 0) {
    return;
  }

  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  if (!template) {
    return;
  }

  const ctx = await loadPlanContext(userId, session, template);

  let sortOrder = 10;
  for (const exercise of template.exercises) {
    const inserted = await insertSessionExercise(
      userId,
      session,
      exercise,
      slotFor(template.slots, exercise.id),
      sortOrder,
      ctx,
    );
    if (inserted) {
      sortOrder += 10;
    }
  }
}

/** Everything the planner needs for a session: weights, lines, scheme. */
export async function loadPlanContext(
  userId: string,
  session: WorkoutSession,
  template: WorkoutTemplateDetail | null,
): Promise<PlanContext> {
  const exerciseIds = template?.exercises.map((exercise) => exercise.id) ?? [];
  const feelIds =
    template?.exercises
      .filter((exercise) => slotNeedsFeel(slotFor(template.slots, exercise.id)))
      .map((exercise) => exercise.id) ?? [];

  const [phaseMaxes, catalog, settings, phase, tracks, feelWeights] =
    await Promise.all([
      session.phase_id
        ? listCurrentPhaseMaxes(userId, session.phase_id)
        : new Map<string, { max_weight: number }>(),
      listExercises(userId, "active"),
      ensureWorkoutSettings(userId),
      getPhase(userId, session.phase_id),
      listTracksByExercise(userId, exerciseIds),
      loadLastWorkWeights(userId, feelIds, session.id),
    ]);

  const maxByExercise = new Map<string, number>();
  for (const exercise of catalog) {
    const weight =
      phaseMaxes.get(exercise.id)?.max_weight ??
      exercise.current_max?.max_weight ??
      null;
    if (weight != null && weight > 0) {
      maxByExercise.set(exercise.id, weight);
    }
  }

  return {
    formulas: settings.formulas,
    phaseKey: phase?.phase_type ?? null,
    maxByExercise,
    trackByExercise: tracks,
    feelWeightByExercise: feelWeights,
  };
}

/** Returns false when the slot cannot be planned yet (no weight or line). */
export async function insertSessionExercise(
  userId: string,
  session: WorkoutSession,
  exercise: Exercise,
  plan: SlotPlan | null,
  sortOrder: number,
  ctx: PlanContext,
): Promise<boolean> {
  const track = ctx.trackByExercise.get(exercise.id) ?? null;
  const maxWeight = ctx.maxByExercise.get(exercise.id) ?? null;
  const planned = plannedSetsForSlot(plan, {
    kind: session.workout_type,
    exercise,
    formulas: ctx.formulas,
    phaseKey: ctx.phaseKey,
    maxWeight,
    trackWeight: track ? trackCurrentWeight(track) : null,
    feelWeight: ctx.feelWeightByExercise.get(exercise.id) ?? null,
  });
  if (planned == null) {
    return false;
  }

  // Snapshot working kg only for this week's scheme.
  const usesTrack = track != null && slotNeedsTrack(plan, ctx.phaseKey);

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("session_exercises")
    .insert({
      user_id: userId,
      session_id: session.id,
      exercise_id: exercise.id,
      sort_order: sortOrder,
      // Only percent-based slots are anchored to 1ПМ.
      max_weight: slotNeedsMax(plan, exercise, ctx.phaseKey) ? maxWeight : null,
      intensity: plan?.intensity ?? null,
      note: plan?.note ?? null,
      track_id: usesTrack && track ? track.id : null,
      track_step: usesTrack && track ? track.position : null,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === "23505") {
      return false;
    }
    throw inserted.error ?? new Error("Session exercise insert failed");
  }

  const sessionExercise = mapSessionExercise(
    inserted.data as Record<string, unknown>,
  );
  if (planned.length === 0) {
    return true;
  }

  const setsInsert = await supabase.from("workout_sets").insert(
    planned.map((set) => ({
      user_id: userId,
      session_exercise_id: sessionExercise.id,
      set_type: set.set_type,
      set_number: set.set_number,
      planned_weight: set.planned_weight,
      planned_reps: set.planned_reps,
      planned_reps_to: set.planned_reps_to,
      planned_seconds: set.planned_seconds,
      planned_rir: set.planned_rir,
    })),
  );

  if (setsInsert.error) {
    throw setsInsert.error;
  }

  return true;
}
