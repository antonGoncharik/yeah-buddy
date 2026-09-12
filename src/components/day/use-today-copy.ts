"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  copyNotFoundMessage,
  postCopyWithConflict,
} from "@/components/day/today-copy-request";
import { useTodayNamedMeals } from "@/components/day/use-today-named";
import { useConfirm } from "@/components/layout/confirm-provider";
import { postJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import { DAY_EXISTS_REPLACE, LOAD_FAILED } from "@/lib/messages";
import { mealExistsReplace } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealType, NamedMealHint } from "@/lib/types";

export function useTodayCopy({
  viewOnly,
  date,
  day,
  setBusy,
  setActionError,
  setDay,
  setNamedMeals,
}: {
  viewOnly: boolean;
  date: string;
  day: DayWithMeals | null;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setDay: Dispatch<SetStateAction<DayWithMeals | null>>;
  setNamedMeals: Dispatch<SetStateAction<NamedMealHint[]>>;
}) {
  const confirm = useConfirm();
  const named = useTodayNamedMeals({
    viewOnly,
    setBusy,
    setActionError,
    setNamedMeals,
  });

  async function runReplaceCopy({
    needsConfirm,
    message,
    post,
    treat404,
  }: {
    needsConfirm: boolean;
    message: string;
    post: (replace: boolean) => Promise<unknown>;
    treat404?: boolean;
  }) {
    if (viewOnly) {
      return;
    }

    let replace = false;
    if (needsConfirm) {
      const ok = await confirm({
        message,
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
        post,
        replace,
        confirm,
        message,
      );
      if (!result) {
        return;
      }
      setDay(readDay(result.data));
      haptic("success");
    } catch (caught) {
      const notFound = treat404 ? copyNotFoundMessage(caught) : null;
      if (notFound) {
        haptic("warn");
        setActionError(notFound);
        return;
      }
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function fillFromTemplate(url: string) {
    if (viewOnly) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const data = await postJson(url, {});
      setDay(readDay(data));
      haptic("success");
    } catch (caught) {
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function copyYesterday() {
    await runReplaceCopy({
      needsConfirm: Boolean(day),
      message: DAY_EXISTS_REPLACE,
      treat404: true,
      post: (replaceFlag) =>
        postJson("/api/days/copy-yesterday", { date, replace: replaceFlag }),
    });
  }

  async function copyMealFromDate(
    mealId: string,
    mealType: MealType,
    sourceDate: string,
  ) {
    const current = day?.meals.find((meal) => meal.id === mealId);
    await runReplaceCopy({
      needsConfirm: Boolean(current && current.items.length > 0),
      message: mealExistsReplace(mealType),
      treat404: true,
      post: (replaceFlag) =>
        postJson(`/api/meals/${mealId}/copy`, {
          sourceDate,
          replace: replaceFlag,
        }),
    });
  }

  async function applyNamedMeal(
    mealId: string,
    mealType: MealType,
    namedMealId: string,
  ) {
    const current = day?.meals.find((meal) => meal.id === mealId);
    await runReplaceCopy({
      needsConfirm: Boolean(current && current.items.length > 0),
      message: mealExistsReplace(mealType),
      post: (replaceFlag) =>
        postJson(`/api/meals/${mealId}/copy-named`, {
          namedMealId,
          replace: replaceFlag,
        }),
    });
  }

  return {
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal: named.saveNamedMeal,
    deleteNamedMeal: named.deleteNamedMeal,
    fillDayFromTemplate: (dayId: string) =>
      fillFromTemplate(`/api/days/${dayId}/fill-template`),
    fillMealFromTemplate: (mealId: string) =>
      fillFromTemplate(`/api/meals/${mealId}/fill-template`),
  };
}
