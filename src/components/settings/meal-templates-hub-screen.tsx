"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { DAY_TEMPLATE_TITLES, formatKcal, sumMealItems } from "@/lib/nutrition";
import type { DayType, MealTemplateDetail } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

const CARDS: Array<{ dayType: DayType; hint: string }> = [
  {
    dayType: "rest",
    hint: "Состав нового дня без тренировки",
  },
  {
    dayType: "training",
    hint: "Состав нового дня с тренировкой",
  },
];

export function MealTemplatesHubScreen() {
  const [templates, setTemplates] = useState<MealTemplateDetail[]>([]);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        "/api/meal-templates",
        (data) => {
          const list = readTemplates(data);
          if (!list) {
            return false;
          }
          setTemplates(list);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setTemplates([]);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Шаблоны еды" backHref="/settings" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <p className="text-base text-muted-foreground">
          Новый день получит этот состав. Уже записанные дни не меняются.
        </p>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && templates.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && templates.length > 0
          ? CARDS.map((card, index) => {
              const template = templates.find(
                (row) => row.day_type === card.dayType,
              );
              const totals = template
                ? sumMealItems(template.items)
                : { kcal: 0 };
              const empty = !template || template.items.length === 0;

              return (
                <NavRow
                  key={card.dayType}
                  href={`/settings/meals/${card.dayType}`}
                  title={DAY_TEMPLATE_TITLES[card.dayType]}
                  hint={
                    empty
                      ? `Пока пусто. ${card.hint}`
                      : `${formatKcal(totals.kcal)} ккал · ${card.hint}`
                  }
                  className="card-surface animate-rise px-5 py-4 hover:bg-muted/30"
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              );
            })
          : null}
      </div>
    </div>
  );
}

function readTemplates(data: unknown): MealTemplateDetail[] | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("templates" in data) ||
    !Array.isArray(data.templates)
  ) {
    return null;
  }

  return data.templates as MealTemplateDetail[];
}
