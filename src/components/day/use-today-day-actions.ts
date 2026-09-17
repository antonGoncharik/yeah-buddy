"use client";

import { useCallback } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  ApiError,
  deleteJson,
  mutateJson,
  patchJson,
  peekJson,
  postJson,
} from "@/lib/api-cache";
import {
  daysUrl,
  optimisticCreatedDay,
  peekTemplate,
  targetsFromCache,
  withDayOptimistic,
  writeDayResponse,
} from "@/lib/day/cache";
import type { DayWithMeals } from "@/lib/day/map";
import {
  isTempId,
  replaceItemsFromTemplate,
  withBodyWeight,
  withDayType,
  withRemovedItem,
} from "@/lib/day/optimistic";
import { mealsMatchRecipe } from "@/lib/day/remaining";
import { readDay, readRecipes } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { DayType, MealItem } from "@/lib/types";

export function useTodayDayActions({
  viewOnly,
  date,
  day,
}: {
  viewOnly: boolean;
  date: string;
  day: DayWithMeals | null;
}) {
  const confirm = useConfirm();

  const createDay = useCallback(
    async (dayType: DayType) => {
      if (viewOnly) {
        return;
      }

      haptic("commit");
      await withDayOptimistic(
        date,
        optimisticCreatedDay(date, dayType),
        async () => {
          try {
            const data = await postJson("/api/days", { date, dayType });
            const next = writeDayResponse(date, data);
            if (!next) {
              throw new Error(LOAD_FAILED);
            }
            return "keep";
          } catch (caught) {
            if (caught instanceof ApiError && caught.status === 409) {
              const data = await mutateJson(daysUrl(date));
              const next = writeDayResponse(date, data);
              if (!next) {
                throw new Error(LOAD_FAILED);
              }
              return "keep";
            }
            throw caught;
          }
        },
      );
    },
    [date, viewOnly],
  );

  async function switchType(dayType: DayType) {
    if (viewOnly || !day || isTempId(day.id)) {
      return;
    }

    if (day.is_training_day === (dayType === "training")) {
      return;
    }

    const recipes = readRecipes(peekJson(daysUrl(date)));
    const currentRecipe = day.is_training_day ? recipes.training : recipes.rest;
    const swap = mealsMatchRecipe(day.meals, currentRecipe);
    const template = peekTemplate(dayType);
    let optimistic = withDayType(day, dayType, targetsFromCache(dayType));
    if (swap && template) {
      optimistic = replaceItemsFromTemplate(optimistic, template);
    }

    await withDayOptimistic(date, optimistic, async () => {
      const data = await patchJson(`/api/days/${day.id}`, { dayType });
      const next = writeDayResponse(date, data);
      return next ?? "keep";
    });
  }

  async function saveBodyWeight(value: number | null) {
    if (viewOnly || !day || isTempId(day.id)) {
      return;
    }

    await withDayOptimistic(date, withBodyWeight(day, value), async () => {
      const data = await patchJson(`/api/days/${day.id}`, {
        bodyWeight: value,
      });
      const next = readDay(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      return next;
    });
  }

  async function deleteItem(item: MealItem) {
    if (viewOnly || !day) {
      return;
    }

    const ok = await confirm({
      message: "Убрать продукт?",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    haptic("commit");
    await withDayOptimistic(date, withRemovedItem(day, item.id), async () => {
      if (!isTempId(item.id)) {
        await deleteJson(`/api/meal-items/${item.id}`);
      }
      return "keep";
    });
  }

  return { createDay, switchType, saveBodyWeight, deleteItem };
}
