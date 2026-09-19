"use client";

import { ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import {
  ChartDoodle,
  CookieDoodle,
  LinkDoodle,
  MacroDoodle,
  MugDoodle,
  PairDoodle,
  PlateDoodle,
  WeekDoodle,
} from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { SectionHeading } from "@/components/layout/section-heading";
import { useTheme } from "@/components/layout/theme-provider";
import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsGoalsForm } from "@/components/settings/settings-goals-form";
import { useSettingsScreen } from "@/components/settings/use-settings-screen";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { reviewHref } from "@/lib/ai/review-nav";
import { DARK_THEME_LABEL } from "@/lib/flavor";
import { GUIDE_HINT, GUIDE_HREF, GUIDE_LABEL } from "@/lib/guide";
import { formatKcal } from "@/lib/nutrition";
import {
  timezoneCaption,
  timezoneChoiceLabel,
  timezoneChoicesFor,
} from "@/lib/telegram/timezone-label";
import { cn } from "@/lib/utils";
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
    setTimezone,
  } = useSettingsScreen();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />

      <div className="flex flex-col gap-6 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !form ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        <section className="flex flex-col gap-2">
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            <NavRow
              href={GUIDE_HREF}
              title={GUIDE_LABEL}
              hint={GUIDE_HINT}
              icon={<MugDoodle />}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeading title="Еда" />
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            {!loading && form ? (
              <button
                type="button"
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                aria-expanded={showGoals}
                onClick={() => setShowGoals((open) => !open)}
              >
                <MarkBadge className="size-9 rounded-xl">
                  <MacroDoodle />
                </MarkBadge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-medium">
                    Цели на день
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {restKcal != null && trainingKcal != null
                      ? `Отдых ${formatKcal(restKcal)} · зал ${formatKcal(trainingKcal)} ккал`
                      : "Белок, жир и углеводы"}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-out-soft)]",
                    showGoals && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            ) : null}
            <NavRow
              href="/settings/meals"
              title={MEAL_TEMPLATES_LABEL}
              hint="Что подставлять в новый день"
              icon={<PlateDoodle />}
            />
            <NavRow
              href="/foods"
              title="Продукты"
              hint="Свои продукты. Из них собирается день."
              icon={<CookieDoodle />}
            />
          </div>
          {!loading && form && showGoals ? (
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
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeading title="Журнал" />
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            <NavRow
              href={reviewHref("settings")}
              title={REVIEW_LABEL}
              hint="Еда, зал и вес за 14, 30 или 90 дней"
              icon={<ChartDoodle />}
            />
            <NavRow
              href="/today/week?from=settings"
              title="Неделя"
              hint="Еда и зал за 7 дней"
              icon={<WeekDoodle />}
            />
            <NavRow
              href="/today/history?from=settings"
              title="История еды"
              hint="14, 30 или 90 дней"
              icon={<CookieDoodle />}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeading title="Ещё" />
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            <NavRow
              href="/settings/packs"
              title={PACKS_LABEL}
              hint="Поделиться едой на день или программой тренировок"
              icon={<LinkDoodle />}
            />
            <NavRow
              href="/onboarding?again=1"
              title="Белок на день"
              hint="Задать заново. Еда на день и программа не изменятся"
              icon={<PairDoodle />}
            />
          </div>
        </section>

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
                label: DARK_THEME_LABEL,
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
              {now
                ? timezoneCaption(form.timezone, now)
                : timezoneChoiceLabel(form.timezone)}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Пояс</span>
              <select
                className="field-control h-12 w-full rounded-xl border border-input/70 bg-input-bg px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.timezone}
                onChange={(event) => void setTimezone(event.target.value)}
              >
                {timezoneChoicesFor(form.timezone).map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              className="h-12 text-base"
              onClick={() =>
                void setTimezone(
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                )
              }
            >
              Как на телефоне
            </Button>
            <p className="text-sm text-muted-foreground">
              В 20:00 в этом поясе — одно сообщение. Нет еды — напомнит.
              Тренировочный день без «Готово» — про очередь. Отдых или закрытый
              зал и записанная еда — «Yeah buddy». После 20:00 второе не придёт.
              Воскресенье — табло за 14 дней с «Как прошло».
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

        {!loading && form ? <SettingsAccount /> : null}
      </div>
    </div>
  );
}
