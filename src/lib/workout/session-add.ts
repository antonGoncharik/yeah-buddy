import type {
  ExerciseWorkoutType,
  SessionDetail,
  SlotPlan,
  WorkoutKind,
} from "@/lib/types";
import { listTracksByExercise } from "@/lib/workout/exercise-tracks";
import { getExercise } from "@/lib/workout/exercises";
import { loadLastWorkWeights } from "@/lib/workout/session-last-weights";
import {
  insertSessionExercise,
  loadPlanContext,
  type PlanContext,
} from "@/lib/workout/session-plan";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";
import { getTemplate } from "@/lib/workout/templates";

export function resolveAdHocKind(
  exerciseType: ExerciseWorkoutType,
  sessionType: WorkoutKind,
): "dynamic" | "static" {
  if (exerciseType === "static") {
    return "static";
  }
  if (exerciseType === "both" && sessionType === "static") {
    return "static";
  }
  return "dynamic";
}

/** Three working sets when the usual percent plan has no weight yet. */
export function adHocFeelPlan(kind: "dynamic" | "static"): SlotPlan {
  return {
    groups: [
      kind === "static"
        ? {
            sets: 3,
            reps: null,
            reps_to: null,
            seconds: 30,
            load: { type: "feel" },
          }
        : {
            sets: 3,
            reps: 8,
            reps_to: null,
            seconds: null,
            load: { type: "feel" },
          },
    ],
    intensity: null,
    warmup: false,
    note: null,
  };
}

export async function addSessionExercise(
  userId: string,
  sessionId: string,
  exerciseId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  if (session.status !== "planned") {
    throw new Error("Добавить упражнение можно только в открытой тренировке.");
  }

  const exercise = await getExercise(userId, exerciseId);
  if (!exercise?.is_active) {
    throw new Error("Упражнение не найдено.");
  }

  const current = await loadSessionDetail(userId, session);
  if (current.exercises.some((item) => item.exercise_id === exercise.id)) {
    return current;
  }

  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const ctx = await loadPlanContext(userId, session, template);
  await attachExercisePlanContext(ctx, userId, session.id, exercise.id);

  const sortOrder =
    current.exercises.reduce((max, item) => Math.max(max, item.sort_order), 0) +
    10;
  const planned = await insertSessionExercise(
    userId,
    session,
    exercise,
    null,
    sortOrder,
    ctx,
  );
  const inserted =
    planned ||
    (await insertSessionExercise(
      userId,
      session,
      exercise,
      adHocFeelPlan(
        resolveAdHocKind(exercise.workout_type, session.workout_type),
      ),
      sortOrder,
      ctx,
    ));

  const detail = await loadSessionDetail(userId, session);
  if (
    inserted ||
    detail.exercises.some((item) => item.exercise_id === exercise.id)
  ) {
    return detail;
  }

  throw new Error("Не получилось добавить упражнение.");
}

async function attachExercisePlanContext(
  ctx: PlanContext,
  userId: string,
  sessionId: string,
  exerciseId: string,
): Promise<void> {
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
