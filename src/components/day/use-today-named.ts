"use client";

import type { Dispatch, SetStateAction } from "react";
import { readNamedMealHint } from "@/components/day/today-copy-request";
import { useConfirm, usePrompt } from "@/components/layout/confirm-provider";
import { reportActionError } from "@/lib/action-error";
import { deleteJson, postJson } from "@/lib/api-cache";
import { writeCachedNamedMeals } from "@/lib/day/cache";
import { LOAD_FAILED } from "@/lib/messages";
import { getMealLabel } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealType, NamedMealHint } from "@/lib/types";

export function useTodayNamedMeals({
  viewOnly,
  date,
  setNamedMeals,
}: {
  viewOnly: boolean;
  date: string;
  setNamedMeals: Dispatch<SetStateAction<NamedMealHint[]>>;
}) {
  const confirm = useConfirm();
  const prompt = usePrompt();

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
          const next = [...without, saved];
          writeCachedNamedMeals(date, next);
          return next;
        });
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
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

    let previous: NamedMealHint[] = [];
    setNamedMeals((current) => {
      previous = current;
      const next = current.filter((meal) => meal.id !== namedMealId);
      writeCachedNamedMeals(date, next);
      return next;
    });
    haptic("commit");

    try {
      await deleteJson(`/api/named-meals/${namedMealId}`);
    } catch (caught) {
      setNamedMeals(previous);
      writeCachedNamedMeals(date, previous);
      haptic("error");
      reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  return { saveNamedMeal, deleteNamedMeal };
}
