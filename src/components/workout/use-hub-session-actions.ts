"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { mutateJson, peekJson, postJson } from "@/lib/api-cache";
import { daysUrl } from "@/lib/day/cache";
import { mealsMatchRecipe } from "@/lib/day/remaining";
import { readDay, readRecipes } from "@/lib/day/today-payload";
import { switchRestToTrainingMessage } from "@/lib/messages";
import { isOffline } from "@/lib/offline";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import { templateCanPlan } from "@/lib/workout/hints";
import { isRestFoodDay } from "@/lib/workout/hub-payload";
import {
  hubFailAction,
  hubWarnEmptyTemplate,
} from "@/lib/workout/hub-session-errors";
import {
  isEmptyTemplateError,
  queueCreateSession,
} from "@/lib/workout/session-start";

export type HubCreateTarget = "today" | "yesterday";

export function useHubSessionActions({
  date,
  templates,
  session,
  nextTemplate,
  load,
  refreshSessions,
  applySkipOptimistic,
  applyUnskipOptimistic,
  setCreating,
  setSkipping,
  setError,
}: {
  date: string;
  templates: WorkoutTemplateDetail[];
  session: WorkoutSession | null;
  nextTemplate: WorkoutTemplateDetail | null;
  load: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  applySkipOptimistic: (templateId: string) => void;
  applyUnskipOptimistic: () => void;
  setCreating: Dispatch<SetStateAction<HubCreateTarget | null>>;
  setSkipping: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  function reportEmpty() {
    hubWarnEmptyTemplate((message) => setError(message));
  }

  function reportFail(caught: unknown) {
    hubFailAction((message) => setError(message), caught);
  }

  async function confirmRestToTraining(sessionDate: string): Promise<boolean> {
    let dayData = peekJson(daysUrl(sessionDate));
    if (!isOffline()) {
      try {
        dayData = await mutateJson(daysUrl(sessionDate));
      } catch {
        // keep the cached day if the phone is in a basement with a fake "online"
      }
    }
    if (!dayData || !isRestFoodDay(dayData)) {
      return true;
    }
    const day = readDay(dayData);
    return confirm({
      message: switchRestToTrainingMessage({
        isToday: sessionDate === date,
        swapMeals: day
          ? mealsMatchRecipe(day.meals, readRecipes(dayData).rest)
          : false,
      }),
      confirmLabel: "Сделать тренировочным",
      cancelLabel: "Отмена",
    });
  }

  async function createOnDate(
    templateId: string,
    sessionDate: string,
    target: HubCreateTarget,
  ) {
    const template = templates.find((item) => item.id === templateId);
    if (template && !templateCanPlan(template)) {
      reportEmpty();
      return;
    }

    setCreating(target);
    setError(null);

    try {
      if (!(await confirmRestToTraining(sessionDate))) {
        return;
      }

      const created = await queueCreateSession({
        date: sessionDate,
        templateId,
      });
      if (!created) {
        reportEmpty();
        return;
      }
      haptic("commit");
      router.push(`/workouts/sessions/${created.session.id}`);
    } catch (caught) {
      if (isEmptyTemplateError(caught)) {
        reportEmpty();
        return;
      }
      reportFail(caught);
    } finally {
      setCreating(null);
    }
  }

  async function unskipLast() {
    setSkipping(true);
    setError(null);
    applyUnskipOptimistic();

    try {
      await mutateJson("/api/rotation/unskip", { method: "POST" });
      haptic("commit");
      void refreshSessions();
    } catch (caught) {
      reportFail(caught);
      await load();
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

    const skippedId = nextTemplate.id;
    applySkipOptimistic(skippedId);
    setSkipping(true);
    setError(null);

    try {
      await postJson("/api/rotation/skip", { template_id: skippedId });
      haptic("commit");
      void refreshSessions();
    } catch (caught) {
      reportFail(caught);
      await load();
    } finally {
      setSkipping(false);
    }
  }

  return { createOnDate, unskipLast, skipNext };
}
