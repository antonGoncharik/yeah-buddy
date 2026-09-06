"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { formatKcal, sumMealItems } from "@/lib/nutrition";
import type { DayType, MealTemplateDetail } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

const CARDS: Array<{ dayType: DayType; title: string; hint: string }> = [
  {
    dayType: "rest",
    title: "День отдыха",
    hint: "Подставится в новый день без зала",
  },
  {
    dayType: "training",
    title: "День тренировки",
    hint: "Подставится в новый день «как в зале»",
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
          Состав, который копируется в новый день. Уже созданные дни не
          меняются.
        </p>

        {loading ? (
          <p className="animate-fade py-10 text-center text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error && templates.length === 0 ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-10">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
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
                <Link
                  key={card.dayType}
                  href={`/settings/meals/${card.dayType}`}
                  className="card-surface animate-rise flex flex-col gap-1 px-5 py-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-medium">{card.title}</span>
                    <span className="text-sm font-medium text-primary">
                      Править
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {empty ? "Пока пусто" : `${formatKcal(totals.kcal)} ккал`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {card.hint}
                  </span>
                </Link>
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
