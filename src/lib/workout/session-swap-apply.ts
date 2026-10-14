import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseWithMax, MuscleId, SessionDetail } from "@/lib/types";
import { listTracksByExercise } from "@/lib/workout/exercise-tracks";
import { listExercisesForMuscle } from "@/lib/workout/exercises";
import { loadExerciseMuscleMeta } from "@/lib/workout/muscle-load";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import { MUSCLE_LABELS } from "@/lib/workout/muscle-taxonomy";
import { adHocFeelPlan, resolveAdHocKind } from "@/lib/workout/session-add";
import { loadLastWorkWeights } from "@/lib/workout/session-last-weights";
import {
  insertSessionExercise,
  loadPlanContext,
  type PlanContext,
} from "@/lib/workout/session-plan";
import {
  primaryMuscle,
  rankSwapOptions,
  swapMode,
  swapPlanLine,
} from "@/lib/workout/session-swap";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";
import {
  type PlannedSetRow,
  plannedSetsForSlot,
} from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export interface SessionSwapOption {
  exerciseId: string;
  name: string;
  line: string | null;
}

export async function listSessionSwaps(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
): Promise<{
  muscle: string | null;
  muscleId: MuscleId | null;
  options: SessionSwapOption[];
} | null> {
  const ready = await readySwap(userId, sessionId, sessionExerciseId);
  if (!ready) {
    return null;
  }
  const ranked = await rankedSwaps(
    userId,
    ready.session,
    ready.detail,
    ready.target.exercise_id,
  );
  return {
    muscle: ranked.muscle,
    muscleId: ranked.muscleId,
    options: await previewSwaps(userId, ready.session, ranked.options),
  };
}

export async function swapSessionExercise(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
  nextExerciseId: string,
): Promise<SessionDetail | null> {
  const ready = await readySwap(userId, sessionId, sessionExerciseId);
  if (!ready) {
    return null;
  }
  if (ready.session.status !== "planned") {
    throw new Error("Заменить упражнение можно только в открытой тренировке.");
  }
  const mode = swapMode(ready.target.sets);
  if (mode === "blocked") {
    throw new Error("Все рабочие подходы уже отмечены.");
  }

  const ranked = await rankedSwaps(
    userId,
    ready.session,
    ready.detail,
    ready.target.exercise_id,
  );
  const next = ranked.options.find((item) => item.id === nextExerciseId);
  if (!next) {
    throw new Error("Это упражнение на другую мышцу.");
  }

  const template = ready.session.template_id
    ? await getTemplate(userId, ready.session.template_id)
    : null;
  const ctx = await loadPlanContext(userId, ready.session, template);
  await attachOne(ctx, userId, ready.session.id, next.id);
  const kind = resolveAdHocKind(next.workout_type, ready.session.workout_type);
  const sortOrder =
    mode === "continue" ? ready.target.sort_order + 1 : ready.target.sort_order;
  const inserted =
    (await insertSessionExercise(
      userId,
      ready.session,
      next,
      null,
      sortOrder,
      ctx,
    )) ||
    (await insertSessionExercise(
      userId,
      ready.session,
      next,
      adHocFeelPlan(kind),
      sortOrder,
      ctx,
    ));
  if (!inserted) {
    throw new Error("Не получилось заменить упражнение.");
  }

  const supabase = createSupabaseServerClient();
  if (mode === "continue") {
    const openWork = ready.target.sets.filter(
      (set) => !set.is_completed && set.set_type === "work",
    ).length;
    await trimSwappedWorkSets(supabase, userId, sessionId, next.id, openWork);
    const stale = ready.target.sets
      .filter((set) => !set.is_completed)
      .map((set) => set.id);
    if (stale.length > 0) {
      const removed = await supabase
        .from("workout_sets")
        .delete()
        .eq("user_id", userId)
        .in("id", stale);
      if (removed.error) {
        throw removed.error;
      }
    }
    return loadSessionDetail(userId, ready.session);
  }

  const deleted = await supabase
    .from("session_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("id", sessionExerciseId);
  if (deleted.error) {
    throw deleted.error;
  }

  return loadSessionDetail(userId, ready.session);
}

async function trimSwappedWorkSets(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  sessionId: string,
  exerciseId: string,
  keepWork: number,
) {
  const created = await supabase
    .from("session_exercises")
    .select("id, workout_sets(id, set_type, set_number)")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (created.error) {
    throw created.error;
  }
  const sets = Array.isArray(created.data?.workout_sets)
    ? created.data.workout_sets
    : [];
  const work = sets
    .flatMap((set) => {
      if (typeof set !== "object" || set == null) {
        return [];
      }
      if (
        !("id" in set) ||
        typeof set.id !== "string" ||
        !("set_type" in set) ||
        set.set_type !== "work" ||
        !("set_number" in set) ||
        typeof set.set_number !== "number"
      ) {
        return [];
      }
      return [{ id: set.id, set_number: set.set_number }];
    })
    .sort((left, right) => left.set_number - right.set_number);
  const extra = work.slice(Math.max(0, keepWork)).map((set) => set.id);
  if (extra.length === 0) {
    return;
  }
  const removed = await supabase
    .from("workout_sets")
    .delete()
    .eq("user_id", userId)
    .in("id", extra);
  if (removed.error) {
    throw removed.error;
  }
}

async function readySwap(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
) {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  const detail = await loadSessionDetail(userId, session);
  const target = detail.exercises.find((item) => item.id === sessionExerciseId);
  if (!target) {
    throw new Error("Упражнение не найдено в тренировке.");
  }
  return { session, detail, target };
}

async function rankedSwaps(
  userId: string,
  session: { id: string; workout_type: ExerciseWithMax["workout_type"] },
  detail: SessionDetail,
  exerciseId: string,
) {
  const meta = await loadExerciseMuscleMeta(userId, [exerciseId]);
  const muscleId = primaryMuscle(
    resolveExerciseMuscleWeights(
      meta.get(exerciseId) ?? {
        exercise_id: exerciseId,
        name: "",
        source_exercise_id: null,
        body_part: null,
        name_en: null,
        name_ru: null,
        equipment: null,
        target: null,
        secondary_muscles: [],
      },
    ),
  );
  if (!muscleId) {
    return {
      muscle: null,
      muscleId: null,
      options: [] as ExerciseWithMax[],
    };
  }
  const catalog = await listExercisesForMuscle(userId, muscleId);
  const current = detail.exercises.find(
    (item) => item.exercise_id === exerciseId,
  );
  return {
    muscle: MUSCLE_LABELS[muscleId],
    muscleId,
    options: rankSwapOptions({
      currentId: exerciseId,
      currentType: current?.exercise.workout_type ?? session.workout_type,
      takenIds: detail.exercises.map((item) => item.exercise_id),
      options: catalog.map((exercise) => ({
        ...exercise,
        workoutType: exercise.workout_type,
      })),
    }),
  };
}

async function previewSwaps(
  userId: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  options: ExerciseWithMax[],
): Promise<SessionSwapOption[]> {
  if (!session || options.length === 0) {
    return [];
  }
  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const ctx = await loadPlanContext(userId, session, template);
  const ids = options.map((exercise) => exercise.id);
  const [tracks, feel] = await Promise.all([
    listTracksByExercise(userId, ids),
    loadLastWorkWeights(userId, ids, session.id),
  ]);
  for (const [id, track] of tracks) {
    ctx.trackByExercise.set(id, track);
  }
  for (const [id, weight] of feel) {
    if (weight > 0) {
      ctx.feelWeightByExercise.set(id, weight);
    }
  }

  return options.map((exercise) => ({
    exerciseId: exercise.id,
    name: exercise.short_name || exercise.name,
    line: swapPlanLine(previewSets(session.workout_type, exercise, ctx) ?? []),
  }));
}

function previewSets(
  kind: ExerciseWithMax["workout_type"],
  exercise: ExerciseWithMax,
  ctx: PlanContext,
): PlannedSetRow[] | null {
  const track = ctx.trackByExercise.get(exercise.id) ?? null;
  const planned = plannedSetsForSlot(null, {
    kind: kind === "static" ? "static" : "dynamic",
    exercise,
    formulas: ctx.formulas,
    phaseKey: ctx.phaseKey,
    maxWeight: ctx.maxByExercise.get(exercise.id) ?? null,
    trackWeight: track ? trackCurrentWeight(track) : null,
    feelWeight: ctx.feelWeightByExercise.get(exercise.id) ?? null,
  });
  if (planned) {
    return planned;
  }
  return plannedSetsForSlot(
    adHocFeelPlan(
      resolveAdHocKind(
        exercise.workout_type,
        kind === "static" ? "static" : "dynamic",
      ),
    ),
    {
      kind: kind === "static" ? "static" : "dynamic",
      exercise,
      formulas: ctx.formulas,
      phaseKey: ctx.phaseKey,
      maxWeight: ctx.maxByExercise.get(exercise.id) ?? null,
      trackWeight: track ? trackCurrentWeight(track) : null,
      feelWeight: ctx.feelWeightByExercise.get(exercise.id) ?? null,
    },
  );
}

async function attachOne(
  ctx: PlanContext,
  userId: string,
  sessionId: string,
  exerciseId: string,
) {
  const [tracks, feel] = await Promise.all([
    listTracksByExercise(userId, [exerciseId]),
    loadLastWorkWeights(userId, [exerciseId], sessionId),
  ]);
  const track = tracks.get(exerciseId);
  if (track) {
    ctx.trackByExercise.set(exerciseId, track);
  }
  const weight = feel.get(exerciseId);
  if (weight != null && weight > 0) {
    ctx.feelWeightByExercise.set(exerciseId, weight);
  }
}
