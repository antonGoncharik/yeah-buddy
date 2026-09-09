import { z } from "zod";

import { macroGoalsFromProtein } from "@/lib/nutrition";
import {
  getUserSettings,
  isOnboardingCompleted,
  saveUserSettings,
} from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseWithMax, UserSettings } from "@/lib/types";
import {
  correctStartingMax,
  listExercises,
  StartingMaxLockedError,
} from "@/lib/workout/exercises";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { listTemplates, saveRotation } from "@/lib/workout/templates";

export const onboardingCompleteSchema = z.object({
  protein: z.number().finite().positive().max(400).optional(),
  circle: z.enum(["starter", "empty", "keep"]),
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
export type OnboardingCircle = "starter" | "empty";

export type OnboardingState = {
  completed: boolean;
  settings: UserSettings;
  exercises: ExerciseWithMax[];
  circle: OnboardingCircle;
  maxesLocked: boolean;
};

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    throw new Error("Настройки не нашлись.");
  }

  await ensureStarterExercises(createSupabaseServerClient(), userId);
  const [exercises, templates, macro] = await Promise.all([
    listExercises(userId, "active"),
    listTemplates(userId),
    getCurrentMacroState(userId),
  ]);

  const circle: OnboardingCircle = templates.some(
    (template) => template.is_active,
  )
    ? "starter"
    : "empty";

  return {
    completed: isOnboardingCompleted(settings),
    settings,
    exercises: sortOnboardingExercises(exercises),
    circle,
    maxesLocked: macro.phase != null,
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

  if (input.protein != null) {
    const goals = macroGoalsFromProtein(input.protein, current);
    await saveUserSettings(userId, {
      rest_protein: goals.rest.protein,
      rest_fat: goals.rest.fat,
      rest_carbs: goals.rest.carbs,
      training_protein: goals.training.protein,
      training_fat: goals.training.fat,
      training_carbs: goals.training.carbs,
    });
  }

  if (input.circle !== "keep") {
    const templates = await listTemplates(userId);
    if (templates.length > 0) {
      await saveRotation(userId, {
        rotation: templates.map((template) => ({
          id: template.id,
          sort_order: template.sort_order,
          is_active: input.circle === "starter",
        })),
      });
    }
  }

  const macro = await getCurrentMacroState(userId);
  if (macro.phase == null && input.maxes.length > 0) {
    const allowed = new Set(
      (await listExercises(userId, "active")).map((exercise) => exercise.id),
    );
    for (const item of input.maxes) {
      if (!allowed.has(item.exerciseId)) {
        continue;
      }

      try {
        await correctStartingMax({
          userId,
          exerciseId: item.exerciseId,
          maxWeight: item.maxWeight,
        });
      } catch (error) {
        if (error instanceof StartingMaxLockedError) {
          break;
        }
        throw error;
      }
    }
  }

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

  return getOnboardingState(userId);
}

function sortOnboardingExercises(
  exercises: ExerciseWithMax[],
): ExerciseWithMax[] {
  const slotRank: Record<string, number> = { a: 0, b: 1, c: 2 };
  return [...exercises].sort((left, right) => {
    const leftSlot = left.slot == null ? 9 : (slotRank[left.slot] ?? 8);
    const rightSlot = right.slot == null ? 9 : (slotRank[right.slot] ?? 8);
    if (leftSlot !== rightSlot) {
      return leftSlot - rightSlot;
    }
    return left.created_at.localeCompare(right.created_at);
  });
}
