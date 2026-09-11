"use client";

import { Moon, Sun } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenLoading } from "@/components/layout/screen-status";
import { useTheme } from "@/components/layout/theme-provider";
import { SettingsGoalsForm } from "@/components/settings/settings-goals-form";
import { useSettingsScreen } from "@/components/settings/use-settings-screen";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { formatKcal } from "@/lib/nutrition";
import {
  MEAL_TEMPLATES_LABEL,
  PACKS_LABEL,
  REVIEW_LABEL,
} from "@/lib/workout/labels";

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const {
    form,
    loading,
    error,
    saved,
    saving,
    showGoals,
    setShowGoals,
    restKcal,
    trainingKcal,
    load,
    onSubmit,
    updateField,
    setReminders,
  } = useSettingsScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
          <h2 className="text-xl font-semibold">Тема</h2>
          <Segmented
            value={theme}
            options={[
              {
                id: "light",
                label: "Светлая",
                icon: <Sun className="size-4" aria-hidden />,
              },
              {
                id: "dark",
                label: "Тёмная",
                icon: <Moon className="size-4" aria-hidden />,
              },
            ]}
            onChange={setTheme}
          />
        </section>

        {!loading && form ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
            <h2 className="text-xl font-semibold">Напоминания вечером</h2>
            <p className="text-sm text-muted-foreground">
              Если день пустой — одно сообщение в бот.
            </p>
            <Segmented
              value={form.reminders_enabled ? "on" : "off"}
              options={[
                { id: "on", label: "Вкл" },
                { id: "off", label: "Выкл" },
              ]}
              onChange={(id) => void setReminders(id === "on")}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </section>
        ) : null}

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !form ? (
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

        {!loading && form ? (
          <>
            <button
              type="button"
              className="card-surface animate-rise flex flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-muted/30"
              onClick={() => setShowGoals((open) => !open)}
            >
              <h2 className="text-xl font-semibold">Цели на день</h2>
              <p className="text-sm text-muted-foreground">
                {restKcal != null && trainingKcal != null
                  ? `Отдых ${formatKcal(restKcal)} · зал ${formatKcal(trainingKcal)} ккал`
                  : "Белок, жир и углеводы"}
              </p>
            </button>
            {showGoals ? (
              <SettingsGoalsForm
                form={form}
                restKcal={restKcal}
                trainingKcal={trainingKcal}
                error={error}
                saved={saved}
                saving={saving}
                onSubmit={onSubmit}
                updateField={updateField}
              />
            ) : null}
          </>
        ) : null}

        <h2 className="px-1 text-lg font-semibold">Еда</h2>
        <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
          <NavRow
            href="/foods"
            title="Продукты"
            hint="Свои, из них собирается день"
          />
          <NavRow
            href="/settings/meals"
            title={MEAL_TEMPLATES_LABEL}
            hint="На новый день"
          />
          <NavRow
            href="/today/history?from=settings"
            title="История еды"
            hint="По дням"
          />
        </section>

        <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
          <NavRow href="/workouts" title="Зал" hint="Очередь, схема и цикл" />
        </section>

        <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
          <NavRow
            href="/settings/packs"
            title={PACKS_LABEL}
            hint="Поделиться едой и залом"
          />
          <NavRow
            href="/settings/review"
            title={REVIEW_LABEL}
            hint="Еда и зал за 14 или 30 дней"
          />
          <NavRow
            href="/onboarding?again=1"
            title="Ещё раз с начала"
            hint="Белок и веса. Очередь и еду на день не трогает"
          />
        </section>
      </div>
    </div>
  );
}
