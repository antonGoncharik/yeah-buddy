"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { mutateJson, peekJson, postJson } from "@/lib/api-cache";
import { daysUrl } from "@/lib/day/cache";
import { mealsMatchRecipe } from "@/lib/day/remaining";
import { readDay, readRecipes } from "@/lib/day/today-payload";
import {
  LOAD_FAILED,
  switchRestToTrainingMessage,
  WORKOUT_TEMPLATE_EMPTY,
} from "@/lib/messages";
import { isOffline } from "@/lib/offline";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import { templateCanPlan } from "@/lib/workout/hints";
import { isRestFoodDay } from "@/lib/workout/hub-payload";
import {
  isEmptyTemplateError,
  queueCreateSession,
} from "@/lib/workout/session-start";

export function useHubSessionActions({
  date,
  templates,
  session,
  nextTemplate,
  load,
  setCreating,
  setSkipping,
  setError,
}: {
  date: string;
  templates: WorkoutTemplateDetail[];
  session: WorkoutSession | null;
  nextTemplate: WorkoutTemplateDetail | null;
  load: () => Promise<void>;
  setCreating: Dispatch<SetStateAction<boolean>>;
  setSkipping: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function createOnDate(templateId: string, sessionDate: string) {
    const template = templates.find((item) => item.id === templateId);
    if (template && !templateCanPlan(template)) {
      haptic("warn");
      setError(WORKOUT_TEMPLATE_EMPTY);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let dayData = peekJson(daysUrl(sessionDate));
      if (!isOffline()) {
        try {
          dayData = await mutateJson(daysUrl(sessionDate));
        } catch {
          // keep the cached day if the phone is in a basement with a fake "online"
        }
      }
      if (dayData && isRestFoodDay(dayData)) {
        const day = readDay(dayData);
        const ok = await confirm({
          message: switchRestToTrainingMessage({
            isToday: sessionDate === date,
            swapMeals: day
              ? mealsMatchRecipe(day.meals, readRecipes(dayData).rest)
              : false,
          }),
          confirmLabel: "Сделать тренировочным",
          cancelLabel: "Отмена",
        });
        if (!ok) {
          return;
        }
      }

      const created = await queueCreateSession({
        date: sessionDate,
        templateId,
      });
      if (!created) {
        haptic("warn");
        setError(WORKOUT_TEMPLATE_EMPTY);
        return;
      }
      haptic("commit");
      router.push(`/workouts/sessions/${created.session.id}`);
    } catch (caught) {
      if (isEmptyTemplateError(caught)) {
        haptic("warn");
        setError(WORKOUT_TEMPLATE_EMPTY);
        return;
      }
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setCreating(false);
    }
  }

  async function unskipLast() {
    setSkipping(true);
    setError(null);

    try {
      await mutateJson("/api/rotation/unskip", { method: "POST" });
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSkipping(false);
    }
  }

  async function skipNext(following: WorkoutTemplateDetail) {
    if (!nextTemplate || session) {
      return;
    }

    const ok = await confirm({
      message: `Пропустить «${nextTemplate.name}»? Следующей станет «${following.name}». Пропущенную можно вернуть.`,
      confirmLabel: "Пропустить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setSkipping(true);
    setError(null);

    try {
      await postJson("/api/rotation/skip", { template_id: nextTemplate.id });
      haptic("commit");
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSkipping(false);
    }
  }

  async function pickTemplate(template: WorkoutTemplateDetail) {
    if (session) {
      return;
    }

    if (nextTemplate && template.id !== nextTemplate.id) {
      const ok = await confirm({
        message: `Начать «${template.name}» вместо «${nextTemplate.name}»?`,
        confirmLabel: "Начать",
        cancelLabel: "Оставить",
      });
      if (!ok) {
        return;
      }
    }

    void createOnDate(template.id, date);
  }

  return { createOnDate, unskipLast, skipNext, pickTemplate };
}
