"use client";

import type { Dispatch, SetStateAction } from "react";
import { readNamedMealHint } from "@/components/day/today-copy-request";
import { useConfirm, usePrompt } from "@/components/layout/confirm-provider";
import { deleteJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { getMealLabel } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealType, NamedMealHint } from "@/lib/types";

export function useTodayNamedMeals({
  viewOnly,
  setBusy,
  setActionError,
  setNamedMeals,
}: {
  viewOnly: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
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

  return { saveNamedMeal, deleteNamedMeal };
}
