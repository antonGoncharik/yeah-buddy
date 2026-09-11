"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { ApiError, postJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import {
  DAY_EXISTS_REPLACE,
  LOAD_FAILED,
  YESTERDAY_MEAL_EMPTY,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { mealExistsReplace } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealType } from "@/lib/types";

export function useTodayCopy({
  viewOnly,
  date,
  day,
  setBusy,
  setActionError,
  setDay,
}: {
  viewOnly: boolean;
  date: string;
  day: DayWithMeals | null;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setDay: Dispatch<SetStateAction<DayWithMeals | null>>;
}) {
  const confirm = useConfirm();

  async function copyYesterday() {
    if (viewOnly) {
      return;
    }

    let replace = false;
    if (day) {
      const ok = await confirm({
        message: DAY_EXISTS_REPLACE,
        confirmLabel: "Заменить",
        cancelLabel: "Оставить",
        destructive: true,
      });
      if (!ok) {
        return;
      }
      replace = true;
    }

    setBusy(true);
    setActionError(null);

    try {
      const result = await postCopyWithConflict(
        (replaceFlag) =>
          postJson("/api/days/copy-yesterday", { date, replace: replaceFlag }),
        replace,
        confirm,
        DAY_EXISTS_REPLACE,
      );
      if (!result) {
        return;
      }

      setDay(readDay(result.data));
      haptic("success");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        haptic("warn");
        setActionError(
          caught.message === LOAD_FAILED ? YESTERDAY_MISSING : caught.message,
        );
        return;
      }
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function copyMealYesterday(mealId: string, mealType: MealType) {
    if (viewOnly) {
      return;
    }

    const current = day?.meals.find((meal) => meal.id === mealId);
    let replace = false;
    if (current && current.items.length > 0) {
      const ok = await confirm({
        message: mealExistsReplace(mealType),
        confirmLabel: "Заменить",
        cancelLabel: "Оставить",
        destructive: true,
      });
      if (!ok) {
        return;
      }
      replace = true;
    }

    setBusy(true);
    setActionError(null);

    try {
      const result = await postCopyWithConflict(
        (replaceFlag) =>
          postJson(`/api/meals/${mealId}/copy-yesterday`, {
            replace: replaceFlag,
          }),
        replace,
        confirm,
        mealExistsReplace(mealType),
      );
      if (!result) {
        return;
      }

      setDay(readDay(result.data));
      haptic("success");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        haptic("warn");
        setActionError(
          caught.message === LOAD_FAILED
            ? YESTERDAY_MEAL_EMPTY
            : caught.message,
        );
        return;
      }
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return { copyYesterday, copyMealYesterday };
}

async function postCopyWithConflict(
  post: (replaceFlag: boolean) => Promise<unknown>,
  replace: boolean,
  confirm: ReturnType<typeof useConfirm>,
  fallbackMessage: string,
): Promise<{ data: unknown } | null> {
  try {
    return { data: await post(replace) };
  } catch (caught) {
    if (!(caught instanceof ApiError) || caught.status !== 409) {
      throw caught;
    }
    const ok = await confirm({
      message:
        caught.message === LOAD_FAILED ? fallbackMessage : caught.message,
      confirmLabel: "Заменить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return null;
    }
    return { data: await post(true) };
  }
}
