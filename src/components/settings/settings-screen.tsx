"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import {
  BookDoodle,
  MacroDoodle,
  MealDayDoodle,
  ProductDoodle,
} from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError } from "@/components/layout/screen-status";
import { SectionHeading } from "@/components/layout/section-heading";
import { useTheme } from "@/components/layout/theme-provider";
import { useTodayOrder } from "@/components/layout/today-order-provider";
import { SettingsAccessSection } from "@/components/settings/settings-access-section";
import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsAppearanceSection } from "@/components/settings/settings-appearance-section";
import { SettingsContactSection } from "@/components/settings/settings-contact-section";
import { SettingsGoalsForm } from "@/components/settings/settings-goals-form";
import { SettingsGymModeSection } from "@/components/settings/settings-gym-mode-section";
import {
  SettingsGoalsSkeleton,
  SettingsGymSkeleton,
  SettingsPrivacySkeleton,
  SettingsRemindersSkeleton,
} from "@/components/settings/settings-loading-skeleton";
import { SettingsRemindersSection } from "@/components/settings/settings-reminders-section";
import { SettingsSyncFailures } from "@/components/settings/settings-sync-failures";
import { useSettingsScreen } from "@/components/settings/use-settings-screen";
import { GUIDE_HINT, GUIDE_HREF, GUIDE_LABEL } from "@/lib/guide";
import { formatKcal } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { MEAL_TEMPLATES_LABEL } from "@/lib/workout/labels";

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = useDiaryDensity();
  const { order, setOrder } = useTodayOrder();
  const {
    form,
    bodyWeight,
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
    updateSex,
    updateGoal,
    updateTrainingAge,
    updateActivity,
    updateGoalPace,
    onRecount,
    setReminders,
    setGymEnabled,
    setTimezone,
    setReminderHour,
    setNoticeFlag,
    setQuietHours,
  } = useSettingsScreen();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />

      <div
        className={cn(
          "flex flex-col gap-6 px-4 pb-4",
          showGoals && "pb-[var(--app-field-scroll-pad)]",
        )}
      >
        {!loading && error && !form ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        <section className="flex flex-col gap-2">
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            <NavRow
              href={GUIDE_HREF}
              title={GUIDE_LABEL}
              hint={GUIDE_HINT}
              icon={<BookDoodle />}
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeading title="Еда и цели" />
          {loading ? <SettingsGoalsSkeleton /> : null}
          {!loading && form ? (
            <div className="card-surface animate-rise px-5 py-2">
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
                    {restKcal != null &&
                    (form.gym_enabled ? trainingKcal != null : true)
                      ? form.gym_enabled && trainingKcal != null
                        ? `Отдых ${formatKcal(restKcal)} · зал ${formatKcal(trainingKcal)} ккал`
                        : restKcal != null
                          ? `${formatKcal(restKcal)} ккал`
                          : "Белок, жир и углеводы"
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
            </div>
          ) : null}
          {!loading && form && showGoals ? (
            <SettingsGoalsForm
              form={form}
              restKcal={restKcal}
              trainingKcal={trainingKcal}
              bodyWeight={bodyWeight}
              error={error}
              saved={saved}
              saving={saving}
              onSubmit={onSubmit}
              updateField={updateField}
              updateSex={updateSex}
              updateGoal={updateGoal}
              updateTrainingAge={updateTrainingAge}
              updateActivity={updateActivity}
              updateGoalPace={updateGoalPace}
              onRecount={onRecount}
              showTrainingGoals={form.gym_enabled}
            />
          ) : null}
          <div className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            <NavRow
              href="/settings/meals"
              title={MEAL_TEMPLATES_LABEL}
              hint="Что подставлять в новый день"
              icon={<MealDayDoodle />}
            />
            <NavRow
              href="/foods"
              title="Продукты"
              hint="Из них собирается еда на день"
              icon={<ProductDoodle />}
            />
          </div>
        </section>

        {loading ? <SettingsGymSkeleton /> : null}
        {!loading && form ? (
          <SettingsGymModeSection
            gymEnabled={form.gym_enabled}
            onChange={(enabled) => void setGymEnabled(enabled)}
          />
        ) : null}

        <SettingsAppearanceSection
          theme={theme}
          setTheme={setTheme}
          density={density}
          setDensity={setDensity}
          order={order}
          setOrder={setOrder}
        />

        {loading ? <SettingsRemindersSkeleton /> : null}
        {!loading && form ? (
          <SettingsRemindersSection
            form={form}
            now={now}
            error={error}
            showGoals={showGoals}
            onTimezone={(timezone) => void setTimezone(timezone)}
            onReminderHour={(hour) => void setReminderHour(hour)}
            onReminders={(enabled) => void setReminders(enabled)}
            onWeeklyDigest={(enabled) =>
              void setNoticeFlag("weekly_digest_enabled", enabled)
            }
            onMonthlyReport={(enabled) =>
              void setNoticeFlag("monthly_report_enabled", enabled)
            }
            onPrPush={(enabled) =>
              void setNoticeFlag("pr_push_enabled", enabled)
            }
            onWeighIn={(enabled) =>
              void setNoticeFlag("weigh_in_enabled", enabled)
            }
            onStreak={(enabled) =>
              void setNoticeFlag("streak_reminder_enabled", enabled)
            }
            onQuietHours={(from, to) => void setQuietHours(from, to)}
          />
        ) : null}

        <SettingsAccessSection />

        {loading ? <SettingsPrivacySkeleton /> : null}
        {!loading && form ? (
          <section className="flex flex-col gap-2">
            <SectionHeading title="Данные и приватность" />
            <SettingsSyncFailures />
            <SettingsAccount />
          </section>
        ) : null}

        <SettingsContactSection />
      </div>
    </div>
  );
}
