"use client";

import { useCallback, useEffect, useState } from "react";

import { RationCards } from "@/components/food/ration-cards";
import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { DayTypeMark } from "@/components/layout/day-type-mark";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PublishPackButton } from "@/components/share/publish-pack-button";
import { cachedGet, postJson, writeJson } from "@/lib/api-cache";
import {
  macroGoalsFromSettings,
  type RationId,
  rationById,
} from "@/lib/food/ration";
import { readMealTemplatesPayload } from "@/lib/meal/parse";
import { writeCachedTemplate } from "@/lib/meal/template-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { DAY_TEMPLATE_TITLES, formatKcal, sumMealItems } from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type { DayType, MealTemplateDetail, UserSettings } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { MEAL_TEMPLATES_LABEL } from "@/lib/workout/labels";

const CARDS: Array<{ dayType: DayType; hint: string }> = [
  {
    dayType: "rest",
    hint: "На день без зала",
  },
  {
    dayType: "training",
    hint: "На день с залом",
  },
];

export function MealTemplatesHubScreen() {
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<MealTemplateDetail[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [applying, setApplying] = useState<RationId | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      const [templatesOk] = await Promise.all([
        cachedGet(
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
        ).then(
          () => true,
          () => false,
        ),
        cachedGet(
          "/api/settings",
          (data) => {
            const loaded = readSettingsPayload(data);
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
      if (!templatesOk) {
        throw new Error(LOAD_FAILED);
      }
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

  async function applyRationChoice(id: RationId) {
    const preset = rationById(id);
    if (!preset || applying) {
      return;
    }
    const dirty = templates.some((row) => row.items.length > 0);
    if (dirty) {
      const ok = await confirm({
        message: `Подставить «${preset.name}»? Состав обоих дней заменится. Записи в дневнике останутся.`,
        confirmLabel: "Подставить",
        cancelLabel: "Оставить",
      });
      if (!ok) {
        return;
      }
    }

    setApplying(id);
    setError(null);
    try {
      const data = await postJson("/api/meal-rations", { id });
      const list = readTemplates(data);
      if (!list) {
        throw new Error(LOAD_FAILED);
      }
      setTemplates(list);
      writeJson("/api/meal-templates", { templates: list });
      for (const template of list) {
        writeCachedTemplate(template.day_type, template);
      }
      haptic("success");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setApplying(null);
    }
  }

  const goals = settings ? macroGoalsFromSettings(settings) : null;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={MEAL_TEMPLATES_LABEL} backHref="/settings" />

      <div className="flex flex-col gap-4 px-4 pb-28">
        <p className="text-base text-muted-foreground">
          Новый день скопирует этот состав. Уже записанное в дневнике не
          изменится.
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
                  icon={
                    <DayTypeMark training={card.dayType === "training"} />
                  }
                  className="card-surface animate-rise px-5 py-4 hover:bg-muted/30"
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              );
            })
          : null}

        {!loading && templates.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Готовые рационы</h2>
              <p className="text-base text-muted-foreground">
                Подставим оба дня и подгоним граммы под цели.
              </p>
            </div>
            <RationCards
              selected={applying}
              goals={goals}
              disabled={applying != null}
              onPick={(id) => void applyRationChoice(id)}
            />
            {error ? (
              <p className="text-center text-base text-destructive">{error}</p>
            ) : null}
          </section>
        ) : null}
      </div>

      {!loading && templates.length > 0 ? (
        <StickyActions>
          <PublishPackButton kind="meals" from="meals" />
        </StickyActions>
      ) : null}
    </div>
  );
}

function readTemplates(data: unknown): MealTemplateDetail[] | null {
  return readMealTemplatesPayload(data);
}
