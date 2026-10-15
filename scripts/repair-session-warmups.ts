import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types";
import { BARBELL_WARMUP, CABLE_WARMUP } from "@/lib/workout/formula-warmups";
import { mapWorkoutSet } from "@/lib/workout/map-session";
import { loadPlanContext, type PlanContext } from "@/lib/workout/session-plan";
import { getSession } from "@/lib/workout/session-read";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  type PlannedSetRow,
  plannedSetsForSlot,
  slotFor,
} from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";
import { trackCurrentWeight } from "@/lib/workout/track-line";

const USAGE =
  "usage: tsx --env-file=.env.local scripts/repair-session-warmups.ts <user-id> <macro-cycle-id>";

async function main() {
  const userId = process.argv[2];
  const macroCycleId = process.argv[3];
  if (!userId || !macroCycleId) {
    throw new Error(USAGE);
  }

  const supabase = createSupabaseServerClient();
  const settings = await ensureWorkoutSettings(userId);
  const formulas = settings.formulas;
  formulas.warmups.dynamic.barbell = structuredClone(BARBELL_WARMUP);
  formulas.warmups.dynamic.cable = structuredClone(CABLE_WARMUP);

  const settingsPatch = await supabase
    .from("workout_settings")
    .update({ formulas })
    .eq("user_id", userId);
  if (settingsPatch.error) {
    throw settingsPatch.error;
  }

  const sessions = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macroCycleId);

  if (sessions.error) {
    throw sessions.error;
  }

  const report: Array<{ sessionId: string; exercises: string[] }> = [];

  for (const row of sessions.data ?? []) {
    const sessionId = String(row.id);
    const session = await getSession(userId, sessionId);
    if (!session?.template_id) {
      continue;
    }
    const template = await getTemplate(userId, session.template_id);
    if (!template) {
      continue;
    }
    const ctx = await loadPlanContext(userId, session, template);
    const touched: string[] = [];

    const exercises = await supabase
      .from("session_exercises")
      .select("id, exercise_id, sort_order")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: true });

    if (exercises.error) {
      throw exercises.error;
    }

    for (const item of exercises.data ?? []) {
      const exercise = template.exercises.find(
        (row) => row.id === item.exercise_id,
      );
      if (!exercise) {
        continue;
      }
      const plan = slotFor(template.slots, exercise.id);
      const planned = plannedSetsForSlot(plan, planCtx(ctx, session, exercise));
      if (!planned) {
        continue;
      }
      const desiredWarmups = planned.filter((set) => set.set_type === "warmup");
      if (desiredWarmups.length === 0) {
        continue;
      }

      const setsResult = await supabase
        .from("workout_sets")
        .select("*")
        .eq("session_exercise_id", item.id)
        .order("set_number", { ascending: true });

      if (setsResult.error) {
        throw setsResult.error;
      }

      const existing = (setsResult.data ?? []).map((set) =>
        mapWorkoutSet(set as Record<string, unknown>),
      );
      await syncWarmupSets(userId, String(item.id), desiredWarmups, existing);
      touched.push(exercise.name);
    }

    if (touched.length > 0) {
      report.push({ sessionId, exercises: touched });
    }
  }

  console.log(JSON.stringify({ updatedSettings: true, report }, null, 2));
}

function planCtx(
  ctx: PlanContext,
  session: { workout_type: "dynamic" | "static" },
  exercise: {
    id: string;
    weight_step: number;
    formula_preset: "barbell" | "cable" | "none";
  },
) {
  const track = ctx.trackByExercise.get(exercise.id) ?? null;
  return {
    kind: session.workout_type,
    exercise,
    formulas: ctx.formulas,
    phaseKey: ctx.phaseKey,
    maxWeight: ctx.maxByExercise.get(exercise.id) ?? null,
    trackWeight: track ? trackCurrentWeight(track) : null,
    feelWeight: ctx.feelWeightByExercise.get(exercise.id) ?? null,
  };
}

async function syncWarmupSets(
  userId: string,
  sessionExerciseId: string,
  desired: PlannedSetRow[],
  existing: WorkoutSet[],
) {
  const supabase = createSupabaseServerClient();
  const warm = existing
    .filter((set) => set.set_type === "warmup")
    .sort((left, right) => left.set_number - right.set_number);
  const work = existing
    .filter((set) => set.set_type === "work")
    .sort((left, right) => left.set_number - right.set_number);

  for (let index = 0; index < desired.length; index += 1) {
    const target = desired[index];
    const row = warm[index];
    if (row) {
      const patch = await supabase
        .from("workout_sets")
        .update({
          planned_weight: target.planned_weight,
          planned_reps: target.planned_reps,
          planned_reps_to: target.planned_reps_to,
          planned_seconds: target.planned_seconds,
          planned_rir: target.planned_rir,
        })
        .eq("id", row.id);
      if (patch.error) {
        throw patch.error;
      }
      continue;
    }

    const insert = await supabase.from("workout_sets").insert({
      user_id: userId,
      session_exercise_id: sessionExerciseId,
      set_type: "warmup",
      set_number: index + 1,
      planned_weight: target.planned_weight,
      planned_reps: target.planned_reps,
      planned_reps_to: target.planned_reps_to,
      planned_seconds: target.planned_seconds,
      planned_rir: target.planned_rir,
      is_completed: false,
      logged: false,
    });
    if (insert.error) {
      throw insert.error;
    }
  }

  for (let index = desired.length; index < warm.length; index += 1) {
    const row = warm[index];
    if (!row) {
      continue;
    }
    const del = await supabase.from("workout_sets").delete().eq("id", row.id);
    if (del.error) {
      throw del.error;
    }
  }

  const warmupCount = desired.length;
  for (let index = 0; index < work.length; index += 1) {
    const row = work[index];
    const nextNumber = warmupCount + index + 1;
    if (row.set_number === nextNumber) {
      continue;
    }
    const patch = await supabase
      .from("workout_sets")
      .update({ set_number: nextNumber })
      .eq("id", row.id);
    if (patch.error) {
      throw patch.error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
