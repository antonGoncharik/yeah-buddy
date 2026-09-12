"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  ApiError,
  deleteJson,
  fetchJson,
  patchJson,
  postJson,
} from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { DayType, MealItem } from "@/lib/types";

export function useTodayDayActions({
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

  const createDay = useCallback(
    async (dayType: DayType) => {
      if (viewOnly) {
        return;
      }

      setBusy(true);
      setActionError(null);

      try {
        const data = await postJson("/api/days", { date, dayType });
        const next = readDay(data);
        if (!next) {
          throw new Error(LOAD_FAILED);
        }
        setDay(next);
        haptic("commit");
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 409) {
          const data = await fetchJson(
            `/api/days?date=${encodeURIComponent(date)}`,
          );
          const next = readDay(data);
          if (!next) {
            throw new Error(LOAD_FAILED);
          }
          setDay(next);
          return;
        }
        haptic("error");
        setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
      } finally {
        setBusy(false);
      }
    },
    [date, setActionError, setBusy, setDay, viewOnly],
  );

  async function switchType(dayType: DayType) {
    if (viewOnly || !day) {
      return;
    }

    if (day.is_training_day === (dayType === "training")) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const data = await patchJson(`/api/days/${day.id}`, { dayType });
      setDay(readDay(data));
    } catch (caught) {
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function saveBodyWeight(value: number | null) {
    if (viewOnly || !day) {
      return;
    }

    setActionError(null);
    const data = await patchJson(`/api/days/${day.id}`, { bodyWeight: value });
    const next = readDay(data);
    if (!next) {
      throw new Error(LOAD_FAILED);
    }
    setDay(next);
  }

  async function deleteItem(item: MealItem) {
    if (viewOnly) {
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

    setBusy(true);
    setActionError(null);

    try {
      await deleteJson(`/api/meal-items/${item.id}`);

      setDay((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          meals: current.meals.map((meal) => ({
            ...meal,
            items: meal.items.filter((row) => row.id !== item.id),
          })),
        };
      });
    } catch (caught) {
      haptic("error");
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return { createDay, switchType, saveBodyWeight, deleteItem };
}
