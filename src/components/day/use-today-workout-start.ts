"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { ApiError, postJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { readTodaySession } from "@/lib/workout/hub-payload";

export function useTodayWorkoutStart({
  viewOnly,
  date,
  shownDay,
  setBusy,
  setActionError,
  load,
}: {
  viewOnly: boolean;
  date: string;
  shownDay: DayWithMeals | null;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  load: () => Promise<void>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function startQueuedWorkout(templateId: string) {
    if (viewOnly) {
      return;
    }

    if (shownDay && !shownDay.is_training_day) {
      const ok = await confirm({
        message:
          "Этот день уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется.",
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
      const data = await postJson("/api/sessions", {
        session_date: date,
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
      if (caught instanceof ApiError && caught.status === 400) {
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
