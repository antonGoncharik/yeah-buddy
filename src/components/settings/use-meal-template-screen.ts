"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { useDayMood } from "@/components/layout/day-mood";
import { subscribeActionError } from "@/lib/action-error";
import { cachedGet, deleteJson, patchJson, writeJson } from "@/lib/api-cache";
import { readMealTemplatePayload } from "@/lib/meal/parse";
import {
  withRemovedTemplateItem,
  writeCachedTemplate,
} from "@/lib/meal/template-cache";
import { LOAD_FAILED } from "@/lib/messages";
import {
  calcKcalFromMacros,
  defaultMacroGoals,
  isMealVisible,
  sumMealItems,
  visibleMealTypes,
} from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type {
  DayType,
  MealTemplateDetail,
  MealTemplateItemView,
  MealType,
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

  useEffect(() => subscribeActionError(setError), []);

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

    if (!template) {
      return;
    }

    const previous = template;
    const next = withRemovedTemplateItem(template, item.id);
    setTemplate(next);
    writeCachedTemplate(dayType, next);
    haptic("commit");

    try {
      await deleteJson(`/api/meal-template-items/${item.id}`);
    } catch (caught) {
      setTemplate(previous);
      writeCachedTemplate(dayType, previous);
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function reorderItems(mealType: MealType, itemIds: string[]) {
    if (!template || busy) {
      return;
    }

    const previous = template;
    const currentMeal = previous.items.filter(
      (item) => item.meal_type === mealType,
    );
    const reordered = itemIds.flatMap((id) => {
      const row = currentMeal.find((item) => item.id === id);
      return row ? [row] : [];
    });
    if (reordered.length !== currentMeal.length) {
      return;
    }

    const next = {
      ...previous,
      items: [
        ...previous.items.filter((item) => item.meal_type !== mealType),
        ...reordered,
      ],
    };
    setTemplate(next);
    setBusy(true);
    setError(null);

    try {
      const data = await patchJson(`/api/meal-templates/${dayType}/items`, {
        mealType,
        itemIds,
      });
      const loaded = readTemplate(data);
      if (loaded) {
        setTemplate(loaded);
        writeJson(`/api/meal-templates/${dayType}`, { template: loaded });
      }
    } catch (caught) {
      setTemplate(previous);
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
    reorderItems,
  };
}

function readTemplate(data: unknown): MealTemplateDetail | null {
  return readMealTemplatePayload(data);
}

function readSettings(data: unknown): UserSettings | null {
  return readSettingsPayload(data);
}
