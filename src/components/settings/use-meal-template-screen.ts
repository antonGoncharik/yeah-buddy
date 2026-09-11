"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { useDayMood } from "@/components/layout/day-mood";
import { cachedGet, deleteJson } from "@/lib/api-cache";
import { readMealTemplatePayload } from "@/lib/meal-map";
import { LOAD_FAILED } from "@/lib/messages";
import {
  calcKcalFromMacros,
  defaultMacroGoals,
  isMealVisible,
  sumMealItems,
  visibleMealTypes,
} from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings-map";
import type {
  DayType,
  MealTemplateDetail,
  MealTemplateItemView,
  UserSettings,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

export function useMealTemplateScreen(dayType: DayType) {
  const confirm = useConfirm();
  const { setMood } = useDayMood();
  const [template, setTemplate] = useState<MealTemplateDetail | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isTrainingDay = dayType === "training";

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      const [templateOk] = await Promise.all([
        cachedGet(
          `/api/meal-templates/${dayType}`,
          (data) => {
            const loaded = readTemplate(data);
            if (!loaded) {
              return false;
            }
            setTemplate(loaded);
            return true;
          },
          () => done(true),
        ).then(
          () => true,
          () => false,
        ),
        cachedGet(
          "/api/settings",
          (data) => {
            const loaded = readSettings(data);
            if (!loaded) {
              return false;
            }
            setSettings(loaded);
            return true;
          },
          () => done(true),
        ).then(
          () => true,
          () => false,
        ),
      ]);

      if (!templateOk) {
        setError(LOAD_FAILED);
        done(false);
        return;
      }

      done(true);
    } catch {
      setError(LOAD_FAILED);
      done(false);
    }
  }, [begin, dayType, done]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setMood(dayType);
    return () => setMood(null);
  }, [dayType, setMood]);

  const mealTypes = useMemo(
    () => visibleMealTypes(isTrainingDay),
    [isTrainingDay],
  );

  const visibleItems = useMemo(() => {
    if (!template) {
      return [];
    }
    return template.items.filter((item) =>
      isMealVisible(item.meal_type, isTrainingDay),
    );
  }, [isTrainingDay, template]);

  const fact = useMemo(() => sumMealItems(visibleItems), [visibleItems]);

  const targets = useMemo(() => {
    const fallback = defaultMacroGoals(isTrainingDay ? "training" : "rest");
    const protein =
      (isTrainingDay ? settings?.training_protein : settings?.rest_protein) ??
      fallback.protein;
    const fat =
      (isTrainingDay ? settings?.training_fat : settings?.rest_fat) ??
      fallback.fat;
    const carbs =
      (isTrainingDay ? settings?.training_carbs : settings?.rest_carbs) ??
      fallback.carbs;

    return {
      target_protein: protein,
      target_fat: fat,
      target_carbs: carbs,
      target_kcal: calcKcalFromMacros(protein, fat, carbs),
    };
  }, [isTrainingDay, settings]);

  async function deleteItem(item: MealTemplateItemView) {
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
    setError(null);

    try {
      await deleteJson(`/api/meal-template-items/${item.id}`);
      setTemplate((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((row) => row.id !== item.id),
            }
          : current,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return {
    template,
    loading,
    error,
    busy,
    mealTypes,
    visibleItems,
    fact,
    targets,
    load,
    deleteItem,
  };
}

function readTemplate(data: unknown): MealTemplateDetail | null {
  return readMealTemplatePayload(data);
}

function readSettings(data: unknown): UserSettings | null {
  return readSettingsPayload(data);
}
