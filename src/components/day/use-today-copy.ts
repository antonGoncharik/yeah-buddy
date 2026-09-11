"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  copyNotFoundMessage,
  postCopyWithConflict,
  readNamedMealHint,
} from "@/components/day/today-copy-request";
import { useConfirm, usePrompt } from "@/components/layout/confirm-provider";
import { deleteJson, postJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import { DAY_EXISTS_REPLACE, LOAD_FAILED } from "@/lib/messages";
import { getMealLabel, mealExistsReplace } from "@/lib/nutrition";
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
  const prompt = usePrompt();

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

  async function fillDayFromTemplate(dayId: string) {
    await fillFromTemplate(`/api/days/${dayId}/fill-template`);
  }

  async function fillMealFromTemplate(mealId: string) {
    await fillFromTemplate(`/api/meals/${mealId}/fill-template`);
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

  async function saveNamedMeal(mealId: string, mealType: MealType) {
    if (viewOnly) {
      return;
    }

    const name = await prompt({
      message: "Как назвать приём?",
      defaultValue: getMealLabel(mealType),
      confirmLabel: "Сохранить",
      placeholder: "Мой завтрак",
    });
    if (!name) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const data = await postJson("/api/named-meals", { name, mealId });
      const saved = readNamedMealHint(data);
      if (saved) {
        setNamedMeals((current) => {
          const without = current.filter(
            (meal) =>
              meal.id !== saved.id &&
              meal.name.toLowerCase() !== saved.name.toLowerCase(),
          );
          return [...without, saved];
        });
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function deleteNamedMeal(namedMealId: string, name: string) {
    if (viewOnly) {
      return;
    }

    const ok = await confirm({
      message: `Удалить «${name}»?`,
      confirmLabel: "Удалить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      await deleteJson(`/api/named-meals/${namedMealId}`);
      setNamedMeals((current) =>
        current.filter((meal) => meal.id !== namedMealId),
      );
    } catch (caught) {
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return {
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    deleteNamedMeal,
    fillDayFromTemplate,
    fillMealFromTemplate,
  };
}
