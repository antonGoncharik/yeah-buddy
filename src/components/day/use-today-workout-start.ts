"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import type { DayWithMeals } from "@/lib/day/map";
import { mealsMatchRecipe, type RecipeLine } from "@/lib/day/remaining";
import {
  LOAD_FAILED,
  switchRestToTrainingMessage,
  WORKOUT_TEMPLATE_EMPTY,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import {
  isEmptyTemplateError,
  queueCreateSession,
} from "@/lib/workout/session-start";

export function useTodayWorkoutStart({
  viewOnly,
  date,
  shownDay,
  restRecipe,
  setBusy,
  setActionError,
}: {
  viewOnly: boolean;
  date: string;
  shownDay: DayWithMeals | null;
  restRecipe: RecipeLine[];
  setBusy: Dispatch<SetStateAction<boolean>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function startQueuedWorkout(templateId: string) {
    if (viewOnly) {
      return;
    }

    if (shownDay && !shownDay.is_training_day) {
      const ok = await confirm({
        message: switchRestToTrainingMessage({
          isToday: true,
          swapMeals: mealsMatchRecipe(shownDay.meals, restRecipe),
        }),
        confirmLabel: "Сделать тренировочным",
        cancelLabel: "Отмена",
      });
      if (!ok) {
        return;
      }
    }

    setBusy(true);
    setActionError(null);
    try {
      const created = await queueCreateSession({ date, templateId });
      if (!created) {
        haptic("warn");
        setActionError(WORKOUT_TEMPLATE_EMPTY);
        return;
      }
      haptic("commit");
      router.push(`/workouts/sessions/${created.session.id}`);
    } catch (caught) {
      if (isEmptyTemplateError(caught)) {
        haptic("warn");
        router.push("/workouts/exercises");
        return;
      }
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return { startQueuedWorkout };
}
