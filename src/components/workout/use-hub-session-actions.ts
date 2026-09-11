"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { mutateJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type {
  ExerciseWithMax,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { templateHasPlanMaxes } from "@/lib/workout/hints";
import { isRestFoodDay, readTodaySession } from "@/lib/workout/hub-payload";

export function useHubSessionActions({
  date,
  templates,
  exercises,
  session,
  nextTemplate,
  load,
  setCreating,
  setSkipping,
  setError,
}: {
  date: string;
  templates: WorkoutTemplateDetail[];
  exercises: ExerciseWithMax[];
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
    if (template && !templateHasPlanMaxes(template, exercises)) {
      haptic("warn");
      router.push("/workouts/exercises");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let dayData: unknown = null;
      try {
        dayData = await mutateJson(
          `/api/days?date=${encodeURIComponent(sessionDate)}`,
        );
      } catch {
        dayData = null;
      }
      if (dayData && isRestFoodDay(dayData)) {
        const ok = await confirm({
          message:
            sessionDate === date
              ? "Этот день уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется."
              : "За этот день еда уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется.",
          confirmLabel: "Сделать тренировочным",
          cancelLabel: "Отмена",
        });
        if (!ok) {
          return;
        }
      }

      const data = await postJson("/api/sessions", {
        session_date: sessionDate,
        template_id: templateId,
      });

      const created = readTodaySession(data);
      if (created) {
        haptic("commit");
        router.push(`/workouts/sessions/${created.id}`);
        return;
      }

      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setCreating(false);
    }
  }

  async function skipTemplate(templateId: string) {
    setSkipping(true);
    setError(null);

    try {
      await postJson("/api/rotation/skip", { template_id: templateId });
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSkipping(false);
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

  return { createOnDate, skipTemplate, unskipLast, pickTemplate };
}
