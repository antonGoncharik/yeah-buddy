"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import {
  BookDoodle,
  ChartDoodle,
  DumbbellDoodle,
  FriendsDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError } from "@/components/layout/screen-status";
import { SectionHeading } from "@/components/layout/section-heading";
import { useTheme } from "@/components/layout/theme-provider";
import { SettingsAccessSection } from "@/components/settings/settings-access-section";
import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsAppearanceSection } from "@/components/settings/settings-appearance-section";
import { SettingsContactSection } from "@/components/settings/settings-contact-section";
import {
  SettingsFoodNavRows,
  SettingsGuideNavRow,
} from "@/components/settings/settings-food-nav-section";
import { SettingsGoalsForm } from "@/components/settings/settings-goals-form";
import { SettingsGymModeSection } from "@/components/settings/settings-gym-mode-section";
import {
  SettingsGoalsSkeleton,
  SettingsGymSkeleton,
  SettingsMenuSkeleton,
  SettingsPrivacySkeleton,
  SettingsRemindersSkeleton,
} from "@/components/settings/settings-loading-skeleton";
import { SettingsPauseSection } from "@/components/settings/settings-pause-section";
import { SettingsRemindersSection } from "@/components/settings/settings-reminders-section";
import { SettingsSyncFailures } from "@/components/settings/settings-sync-failures";
import { useSettingsScreen } from "@/components/settings/use-settings-screen";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

type SettingsPanel = "goals" | "food" | "gym" | "people" | "look" | "data";

const PANEL_TITLES: Record<SettingsPanel, string> = {
  goals: "Цели",
  food: "Еда",
  gym: "Зал",
  people: "Люди",
  look: "Вид и бот",
  data: "Данные",
};

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [panel, setPanel] = useState<SettingsPanel | null>(null);
  const {
    form,
    bodyWeight,
    loading,
    error,
    saved,
    saving,
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

  const goalLines =
    form == null
      ? null
      : form.gym_enabled
        ? [
            `Отдых: ${restKcal == null ? "—" : formatKcal(restKcal)} / Б ${formatMacro(Number(form.rest_protein) || 0)}`,
            `Тренировка: ${trainingKcal == null ? "—" : formatKcal(trainingKcal)} / Б ${formatMacro(Number(form.training_protein) || 0)}`,
          ]
        : [
            `${restKcal == null ? "—" : formatKcal(restKcal)} / Б ${formatMacro(Number(form.rest_protein) || 0)}`,
          ];

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={panel ? PANEL_TITLES[panel] : "Настройки"} />

      <div
        className={cn(
          "flex flex-col gap-6 px-4 pb-4",
          panel === "goals" && "pb-[var(--app-field-scroll-pad)]",
        )}
      >
        {panel ? (
          <button
            type="button"
            className="self-start text-base font-medium text-muted-foreground"
            onClick={() => setPanel(null)}
          >
            Назад
          </button>
        ) : null}

        {!loading && error && !form ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {panel == null ? (
          <>
            {loading ? <SettingsGoalsSkeleton /> : null}
            {loading ? <SettingsMenuSkeleton /> : null}
            {!loading && form && goalLines ? (
              <button
                type="button"
                className="card-surface animate-rise px-5 py-4 text-left"
                onClick={() => setPanel("goals")}
              >
                {goalLines.map((line) => (
                  <span key={line} className="block text-base font-medium">
                    {line}
                  </span>
                ))}
              </button>
            ) : null}
            {!loading ? (
              <div className="card-surface divide-y divide-border/70 px-5 py-2">
                <NavRow
                  title="Еда"
                  hint="Шаблон и свои продукты"
                  icon={<MealDayDoodle />}
                  onClick={() => setPanel("food")}
                />
                <NavRow
                  title="Зал"
                  hint="Вкладка тренировок"
                  icon={<DumbbellDoodle />}
                  onClick={() => setPanel("gym")}
                />
                <NavRow
                  title="Люди"
                  hint="Тренер, пара, паки"
                  icon={<FriendsDoodle />}
                  onClick={() => setPanel("people")}
                />
                <NavRow
                  title="Вид и бот"
                  hint="Тема и напоминания"
                  icon={<BookDoodle />}
                  onClick={() => setPanel("look")}
                />
                <NavRow
                  title="Данные"
                  hint="Пауза, экспорт, удаление"
                  icon={<ChartDoodle />}
                  onClick={() => setPanel("data")}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {panel === "goals" && loading ? <SettingsGoalsSkeleton /> : null}
        {panel === "goals" && !loading && form ? (
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

        {panel === "food" ? (
          <section className="flex flex-col gap-2">
            <SettingsGuideNavRow />
            <SettingsFoodNavRows />
          </section>
        ) : null}

        {panel === "gym" && loading ? <SettingsGymSkeleton /> : null}
        {panel === "gym" && !loading && form ? (
          <SettingsGymModeSection
            gymEnabled={form.gym_enabled}
            onChange={(enabled) => void setGymEnabled(enabled)}
          />
        ) : null}

        {panel === "people" ? <SettingsAccessSection /> : null}

        {panel === "look" ? (
          <>
            <SettingsAppearanceSection theme={theme} setTheme={setTheme} />
            {loading ? <SettingsRemindersSkeleton /> : null}
            {!loading && form ? (
              <SettingsRemindersSection
                form={form}
                now={now}
                error={error}
                showGoals={false}
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
          </>
        ) : null}

        {panel === "data" ? (
          <>
            <SettingsPauseSection />
            {loading ? <SettingsPrivacySkeleton /> : null}
            {!loading && form ? (
              <section className="flex flex-col gap-2">
                <SectionHeading title="Данные и приватность" />
                <SettingsSyncFailures />
                <SettingsAccount />
              </section>
            ) : null}
            <SettingsContactSection />
          </>
        ) : null}
      </div>
    </div>
  );
}
