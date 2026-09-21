"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  copyNotFoundMessage,
  postCopyWithConflict,
} from "@/components/day/today-copy-request";
import { useTodayNamedMeals } from "@/components/day/use-today-named";
import { useConfirm } from "@/components/layout/confirm-provider";
import { reportActionError } from "@/lib/action-error";
import { postJson } from "@/lib/api-cache";
import {
  applyRemainingFromCache,
  optimisticCreatedDay,
  readCachedDay,
  withDayOptimistic,
  writeDayResponse,
} from "@/lib/day/cache";
import { previousIsoDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { copyMealsFrom, isTempId } from "@/lib/day/optimistic";
import { DAY_EXISTS_REPLACE, LOAD_FAILED } from "@/lib/messages";
import { mealExistsReplace } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealType, NamedMealHint } from "@/lib/types";

export function useTodayCopy({
  viewOnly,
  date,
  day,
  setBusy,
  setNamedMeals,
}: {
  viewOnly: boolean;
  date: string;
  day: DayWithMeals | null;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setNamedMeals: Dispatch<SetStateAction<NamedMealHint[]>>;
}) {
  const confirm = useConfirm();
  const named = useTodayNamedMeals({
    viewOnly,
    date,
    setNamedMeals,
    setBusy,
  });

  async function runReplaceCopy({
    needsConfirm,
    message,
    post,
    treat404,
    optimistic,
  }: {
    needsConfirm: boolean;
    message: string;
    post: (replace: boolean) => Promise<unknown>;
    treat404?: boolean;
    optimistic: DayWithMeals | null;
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

    haptic("commit");
    const runPost = async (replaceFlag: boolean) => {
      try {
        return await postCopyWithConflict(post, replaceFlag, confirm, message);
      } catch (caught) {
        const notFound = treat404 ? copyNotFoundMessage(caught) : null;
        if (notFound) {
          haptic("warn");
          throw new Error(notFound);
        }
        haptic("error");
        throw caught;
      }
    };

    if (optimistic) {
      await withDayOptimistic(date, optimistic, async () => {
        const result = await runPost(replace);
        if (!result) {
          return "revert";
        }
        const next = writeDayResponse(date, result.data);
        haptic("success");
        return next ?? "keep";
      });
      return;
    }

    setBusy(true);
    try {
      const result = await runPost(replace);
      if (!result) {
        return;
      }
      writeDayResponse(date, result.data);
      haptic("success");
    } catch (caught) {
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function fillFromTemplate(url: string, mealType?: MealType) {
    if (viewOnly || !day || isTempId(day.id)) {
      return;
    }

    const optimistic = applyRemainingFromCache(day, mealType);
    haptic("commit");
    if (optimistic) {
      await withDayOptimistic(date, optimistic, async () => {
        const data = await postJson(url, {});
        const next = writeDayResponse(date, data);
        haptic("success");
        return next ?? "keep";
      });
      return;
    }

    setBusy(true);
    try {
      const data = await postJson(url, {});
      writeDayResponse(date, data);
      haptic("success");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function copyYesterday() {
    const source = readCachedDay(previousIsoDate(date));
    const base = day ?? optimisticCreatedDay(date, "rest");
    await runReplaceCopy({
      needsConfirm: Boolean(day),
      message: DAY_EXISTS_REPLACE,
      treat404: true,
      optimistic: source ? copyMealsFrom(base, source) : null,
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
    const source = readCachedDay(sourceDate);
    await runReplaceCopy({
      needsConfirm: Boolean(current && current.items.length > 0),
      message: mealExistsReplace(mealType),
      treat404: true,
      optimistic: day && source ? copyMealsFrom(day, source, mealType) : null,
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
      optimistic: null,
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
    shareMeal: named.shareMeal,
    shareNamedMeal: named.shareNamedMeal,
    fillDayFromTemplate: (dayId: string) =>
      fillFromTemplate(`/api/days/${dayId}/fill-template`),
    fillMealFromTemplate: (mealId: string) =>
      fillFromTemplate(
        `/api/meals/${mealId}/fill-template`,
        mealTypeOf(day, mealId),
      ),
  };
}

function mealTypeOf(
  day: DayWithMeals | null,
  mealId: string,
): MealType | undefined {
  return day?.meals.find((meal) => meal.id === mealId)?.meal_type;
}
