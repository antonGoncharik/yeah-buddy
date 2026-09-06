"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DaySummary } from "@/components/day/day-summary";
import { MealCard } from "@/components/day/meal-card";
import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { useDayMood } from "@/components/layout/day-mood";
import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import {
  calcKcalFromMacros,
  isMealVisible,
  sumMealItems,
  visibleMealTypes,
} from "@/lib/nutrition";
import type {
  DayType,
  MealTemplateDetail,
  MealTemplateItemView,
  UserSettings,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

const TITLES: Record<DayType, string> = {
  rest: "День отдыха",
  training: "День тренировки",
};

export function MealTemplateScreen({ dayType }: { dayType: DayType }) {
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
    const protein = isTrainingDay
      ? (settings?.training_protein ?? 200)
      : (settings?.rest_protein ?? 200);
    const fat = isTrainingDay
      ? (settings?.training_fat ?? 70)
      : (settings?.rest_fat ?? 70);
    const carbs = isTrainingDay
      ? (settings?.training_carbs ?? 200)
      : (settings?.rest_carbs ?? 130);

    return {
      target_protein: protein,
      target_fat: fat,
      target_carbs: carbs,
      target_kcal: calcKcalFromMacros(protein, fat, carbs),
    };
  }, [isTrainingDay, settings]);

  async function deleteItem(item: MealTemplateItemView) {
    const ok = await confirm({
      message: "Удалить продукт?",
      confirmLabel: "Удалить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/meal-template-items/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setTemplate((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((row) => row.id !== item.id),
            }
          : current,
      );
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={TITLES[dayType]} backHref="/settings/meals" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        <p className="text-base text-muted-foreground">
          Так подставится новый день этого типа. Уже созданные дни не меняются.
        </p>

        {loading ? (
          <p className="animate-rise py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error && !template ? (
          <div className="animate-rise flex flex-col items-center gap-3">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && template ? (
          <div className="flex flex-col gap-5">
            {error ? (
              <p className="animate-rise text-center text-lg font-medium">
                {error}
              </p>
            ) : null}

            <div className="animate-rise">
              <DaySummary day={targets} fact={fact} factLabel="В шаблоне" />
            </div>

            {mealTypes.map((mealType, index) => {
              const items = visibleItems
                .filter((item) => item.meal_type === mealType)
                .map((item) => ({
                  id: item.id,
                  name: item.food.name,
                  grams: item.grams,
                  protein: item.protein,
                  fat: item.fat,
                  carbs: item.carbs,
                  kcal: item.kcal,
                }));

              return (
                <MealCard
                  key={mealType}
                  mealType={mealType}
                  items={items}
                  itemHref={(item) =>
                    `/settings/meals/${dayType}/items/${item.id}`
                  }
                  addHref={`/settings/meals/${dayType}/${mealType}/add`}
                  className="animate-rise"
                  style={{ animationDelay: `${80 + index * 50}ms` }}
                  onDeleteItem={(line) => {
                    const row = visibleItems.find(
                      (item) => item.id === line.id,
                    );
                    if (row && !busy) {
                      void deleteItem(row);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function readTemplate(data: unknown): MealTemplateDetail | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("template" in data) ||
    !data.template
  ) {
    return null;
  }

  return data.template as MealTemplateDetail;
}

function readSettings(data: unknown): UserSettings | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("settings" in data) ||
    !data.settings
  ) {
    return null;
  }

  return data.settings as UserSettings;
}
