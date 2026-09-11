"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm, usePrompt } from "@/components/layout/confirm-provider";
import { ApiError, deleteJson, postJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import {
  DAY_EXISTS_REPLACE,
  LOAD_FAILED,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { getMealLabel, isMealType, mealExistsReplace } from "@/lib/nutrition";
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

  async function copyMealFromDate(
    mealId: string,
    mealType: MealType,
    sourceDate: string,
  ) {
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
          postJson(`/api/meals/${mealId}/copy`, {
            sourceDate,
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

  async function applyNamedMeal(
    mealId: string,
    mealType: MealType,
    namedMealId: string,
  ) {
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
          postJson(`/api/meals/${mealId}/copy-named`, {
            namedMealId,
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
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
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
      const saved = readNamedMeal(data);
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
  };
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

function readNamedMeal(data: unknown): NamedMealHint | null {
  if (!data || typeof data !== "object" || !("namedMeal" in data)) {
    return null;
  }
  const value = data.namedMeal;
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as {
    id?: unknown;
    name?: unknown;
    meal_type?: unknown;
  };
  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    !isMealType(row.meal_type)
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    meal_type: row.meal_type,
  };
}
