import { z } from "zod";

import type { UserGoal, UserSex } from "@/lib/types";
import { recordFunnelEvent } from "@/lib/funnel";
import {
  listMealTemplates,
  updateTemplateItemGrams,
} from "@/lib/meal-templates";
import {
  macroGoalsFromProtein,
  type Macros,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { scaledTemplateGrams } from "@/lib/onboarding/setup";
import type { OnboardingState } from "@/lib/onboarding/types";
import {
  getUserSettings,
  isOnboardingCompleted,
  saveUserSettings,
} from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pickLiveExerciseId } from "@/lib/workout/dedupe-exercises";
import {
  correctStartingMax,
  listExercises,
  StartingMaxLockedError,
} from "@/lib/workout/exercises";
import { estimateExerciseMaxes } from "@/lib/workout/estimate-maxes";
import { getCurrentMacroState } from "@/lib/workout/macros";
import {
  isProgramPresetId,
  matchProgramPresetId,
  PROGRAM_PRESET_IDS,
} from "@/lib/workout/program-presets";
import {
  applyProgramPreset,
  listTemplates,
  saveRotation,
} from "@/lib/workout/templates";

const optionalKg = z.number().finite().positive().max(500).nullable();

export const onboardingCompleteSchema = z.object({
  protein: z.number().finite().positive().max(400).optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  goal: z.enum(["lose", "keep", "gain"]).nullable().optional(),
  training_age: z.enum(["beginner", "year", "years"]).nullable().optional(),
  body_weight: z.number().finite().min(30).max(250).optional(),
  anchors: z
    .object({
      squat: optionalKg.optional(),
      bench: optionalKg.optional(),
      deadlift: optionalKg.optional(),
    })
    .optional(),
  circle: z.enum([...PROGRAM_PRESET_IDS, "empty", "keep"]),
  fromStart: z.boolean().optional(),
  maxes: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        maxWeight: z.number().finite().positive().max(1000),
      }),
    )
    .default([]),
});

export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error("Настройки не нашлись.");
  }

  const templates = await listTemplates(userId);

  return {
    completed: isOnboardingCompleted(settings),
    settings,
    circle: matchProgramPresetId(templates) ?? "empty",
  };
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingCompleteInput,
): Promise<OnboardingState> {
  const current = await getUserSettings(userId);
  if (!current) {
    throw new Error("Настройки не нашлись.");
  }

  const firstRun = !isOnboardingCompleted(current);

  const profilePatch = {
    ...(input.sex !== undefined ? { sex: input.sex } : {}),
    ...(input.goal !== undefined ? { goal: input.goal } : {}),
    ...(input.training_age !== undefined
      ? { training_age: input.training_age }
      : {}),
  };

  if (input.protein != null) {
    const goals = goalsForOnboarding(input, current);
    await saveUserSettings(userId, {
      rest_protein: goals.rest.protein,
      rest_fat: goals.rest.fat,
      rest_carbs: goals.rest.carbs,
      training_protein: goals.training.protein,
      training_fat: goals.training.fat,
      training_carbs: goals.training.carbs,
      ...profilePatch,
    });
    if (firstRun) {
      await scaleMealTemplatesToProtein(userId, input.protein);
    }
  } else if (Object.keys(profilePatch).length > 0) {
    await saveUserSettings(userId, profilePatch);
  }

  if (isProgramPresetId(input.circle)) {
    await applyProgramPreset(userId, input.circle);
  } else if (input.circle === "empty") {
    const templates = await listTemplates(userId);
    if (templates.length > 0) {
      await saveRotation(userId, {
        rotation: templates.map((template) => ({
          id: template.id,
          sort_order: template.sort_order,
          is_active: false,
        })),
      });
    }
  }

  await applyStartingMaxes(userId, input, firstRun, current);

  const supabase = createSupabaseServerClient();
  const stamped = await supabase
    .from("user_settings")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (stamped.error) {
    throw stamped.error;
  }

  if (firstRun) {
    await recordFunnelEvent(userId, "onboarding_done");
  }
  if (input.fromStart) {
    await recordFunnelEvent(userId, "program_start");
  }

  return getOnboardingState(userId);
}

function goalsForOnboarding(
  input: OnboardingCompleteInput,
  current: NonNullable<Awaited<ReturnType<typeof getUserSettings>>>,
): { rest: Macros; training: Macros } {
  const protein = input.protein;
  if (protein == null) {
    throw new Error("Protein is required");
  }

  const sex = (input.sex ?? current.sex) as UserSex | null;
  const goal = (input.goal ?? current.goal) as UserGoal | null;
  const weightKg = input.body_weight;
  if (sex != null && goal != null && weightKg != null) {
    const suggested = suggestMacroGoals({
      sex,
      weightKg,
      goal,
      protein,
    });
    if (suggested != null) {
      return { rest: suggested.rest, training: suggested.training };
    }
  }

  return macroGoalsFromProtein(protein, current);
}

async function applyStartingMaxes(
  userId: string,
  input: OnboardingCompleteInput,
  firstRun: boolean,
  settings: Awaited<ReturnType<typeof getUserSettings>>,
): Promise<void> {
  const macro = await getCurrentMacroState(userId);
  if (macro.phase != null) {
    return;
  }

  const exercises = await listExercises(userId, "active");
  const byId = new Map(exercises.map((item) => [item.id, item]));
  const wanted = new Map<string, number>();

  for (const item of input.maxes) {
    const exercise = byId.get(item.exerciseId);
    if (!exercise) {
      continue;
    }
    if (!firstRun && exercise.current_max) {
      continue;
    }
    wanted.set(exercise.name, item.maxWeight);
  }

  const sex = input.sex ?? settings?.sex ?? null;
  const trainingAge = input.training_age ?? settings?.training_age ?? null;
  const weightKg = input.body_weight;
  if (sex != null && trainingAge != null && weightKg != null) {
    const estimated = estimateExerciseMaxes({
      sex,
      trainingAge,
      weightKg,
      known: {
        squat: input.anchors?.squat ?? null,
        bench: input.anchors?.bench ?? null,
        deadlift: input.anchors?.deadlift ?? null,
      },
      exercises: exercises.map((item) => ({
        id: item.id,
        name: item.name,
        weight_step: item.weight_step,
        workout_type: item.workout_type,
        has_max: Boolean(item.current_max) || wanted.has(item.name),
      })),
    });

    for (const item of estimated) {
      if (!wanted.has(item.name)) {
        wanted.set(item.name, item.maxWeight);
      }
    }
  }

  await writeStartingMaxes(userId, wanted);
}

async function writeStartingMaxes(
  userId: string,
  wanted: Map<string, number>,
): Promise<void> {
  let exercises = await listExercises(userId, "active");
  for (const [name, maxWeight] of wanted) {
    const exerciseId = liveExerciseId(exercises, name);
    if (!exerciseId) {
      continue;
    }
    try {
      await correctStartingMax({ userId, exerciseId, maxWeight });
    } catch (error) {
      if (error instanceof StartingMaxLockedError) {
        return;
      }
      if (!isForeignKeyViolation(error)) {
        throw error;
      }
      exercises = await listExercises(userId, "active");
      const again = liveExerciseId(exercises, name);
      if (!again || again === exerciseId) {
        continue;
      }
      try {
        await correctStartingMax({
          userId,
          exerciseId: again,
          maxWeight,
        });
      } catch (retry) {
        if (retry instanceof StartingMaxLockedError) {
          return;
        }
        if (isForeignKeyViolation(retry)) {
          continue;
        }
        throw retry;
      }
    }
  }
}

function liveExerciseId(
  exercises: Awaited<ReturnType<typeof listExercises>>,
  name: string,
): string | null {
  return pickLiveExerciseId(
    exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      hasMax: exercise.current_max != null,
    })),
    name,
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23503"
  );
}

async function scaleMealTemplatesToProtein(
  userId: string,
  protein: number,
): Promise<void> {
  const templates = await listMealTemplates(userId);
  for (const template of templates) {
    const updates = scaledTemplateGrams(template.items, protein);
    for (const update of updates) {
      await updateTemplateItemGrams(userId, update.id, update.grams);
    }
  }
}
