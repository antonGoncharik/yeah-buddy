"use client";

import { ChevronRight } from "lucide-react";

import type { SettingsFormState } from "@/components/settings/settings-form-state";
import { Button } from "@/components/ui/button";
import { EARLY_HABIT_REMINDER_NOTE } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import {
  timezoneCaption,
  timezoneChoiceLabel,
  timezoneChoicesFor,
} from "@/lib/telegram/timezone-label";
import { cn } from "@/lib/utils";

export function SettingsRemindersSection({
  form,
  now,
  error,
  showGoals,
  onTimezone,
  onReminderHour,
  onReminders,
  onWeeklyDigest,
  onMonthlyReport,
  onPrPush,
  onWeighIn,
  onStreak,
  onQuietHours,
}: {
  form: SettingsFormState;
  now: Date | null;
  error: string | null;
  showGoals: boolean;
  onTimezone: (timezone: string) => void;
  onReminderHour: (hour: number) => void;
  onReminders: (enabled: boolean) => void;
  onWeeklyDigest: (enabled: boolean) => void;
  onMonthlyReport: (enabled: boolean) => void;
  onPrPush: (enabled: boolean) => void;
  onWeighIn: (enabled: boolean) => void;
  onStreak: (enabled: boolean) => void;
  onQuietHours: (from: number | null, to: number | null) => void;
}) {
  const zoneLabel = now
    ? timezoneCaption(form.timezone, now)
    : timezoneChoiceLabel(form.timezone);

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Напоминания</h2>
      <p className="text-sm text-muted-foreground">
        {EARLY_HABIT_REMINDER_NOTE}
      </p>
      <div className="flex flex-col gap-2">
        <NoticeSwitch
          label="Вечернее напоминание"
          hint={
            form.reminders_enabled
              ? `${form.reminder_hour}:00, если день ещё открыт`
              : "Выключено"
          }
          on={form.reminders_enabled}
          onChange={onReminders}
        />
        {form.reminders_enabled ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Во сколько</span>
            <select
              className="field-control h-12 w-full appearance-none rounded-xl border border-input/70 bg-input-bg px-3 text-base"
              value={String(form.reminder_hour)}
              onChange={(event) =>
                onReminderHour(Number.parseInt(event.target.value, 10))
              }
            >
              {Array.from({ length: 7 }, (_, index) => 17 + index).map(
                (hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ),
              )}
            </select>
          </label>
        ) : null}
      </div>
      <NoticeSwitch
        label="Недельный дайджест"
        hint="Понедельник, 9:00"
        on={form.weekly_digest_enabled}
        onChange={onWeeklyDigest}
      />
      <NoticeSwitch
        label="Месячный отчёт"
        hint="1-е число, 9:00"
        on={form.monthly_report_enabled}
        onChange={onMonthlyReport}
      />
      <NoticeSwitch
        label="Рекорды в чат"
        hint="После тренировки, если подход сильнее прошлого"
        on={form.pr_push_enabled}
        onChange={onPrPush}
      />
      <NoticeSwitch
        label="Взвешивание"
        hint="8:00, если 4 дня без веса"
        on={form.weigh_in_enabled}
        onChange={onWeighIn}
      />
      <NoticeSwitch
        label="Серия"
        hint="20:00, если неделю записывал и сегодня пусто. Не придёт, если вечернее стоит на 20:00 или раньше"
        on={form.streak_reminder_enabled}
        onChange={onStreak}
      />
      <details className="group border-t border-border/70 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-base font-medium">Пояс</span>
            <span className="block text-sm text-muted-foreground">
              {zoneLabel}
            </span>
          </span>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          />
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Пояс</span>
            <span className="relative block">
              <select
                className="field-control h-12 w-full appearance-none rounded-xl border border-input/70 bg-input-bg bg-none py-0 pl-3 pr-8 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.timezone}
                onChange={(event) => onTimezone(event.target.value)}
              >
                {timezoneChoicesFor(form.timezone).map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <ChevronRight
                className="pointer-events-none absolute top-1/2 right-1 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </span>
          </label>
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-base"
            onClick={() =>
              onTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
            }
          >
            Как на телефоне
          </Button>
        </div>
      </details>
      <details className="group border-t border-border/70 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-base font-medium">Тихие часы</span>
            <span className="block text-sm text-muted-foreground">
              {quietSummary(form.quiet_from, form.quiet_to)}
            </span>
          </span>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
            aria-hidden
          />
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            В этом промежутке не пишем. Если «до» раньше «с», тишина идёт через
            полночь.
          </p>
          <span className="grid grid-cols-2 gap-2">
            <span className="flex flex-col gap-1.5">
              <label
                htmlFor="quiet-from"
                className="text-sm text-muted-foreground"
              >
                С
              </label>
              <HourSelect
                id="quiet-from"
                value={form.quiet_from}
                onChange={(hour) => onQuietHours(hour, form.quiet_to)}
              />
            </span>
            <span className="flex flex-col gap-1.5">
              <label
                htmlFor="quiet-to"
                className="text-sm text-muted-foreground"
              >
                До
              </label>
              <HourSelect
                id="quiet-to"
                value={form.quiet_to}
                onChange={(hour) => onQuietHours(form.quiet_from, hour)}
              />
            </span>
          </span>
        </div>
      </details>
      {error && !showGoals ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </section>
  );
}

function NoticeSwitch({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={cn(
          "relative h-6 w-10 shrink-0 appearance-none rounded-full border-0 p-0 transition-colors",
          on ? "bg-primary" : "bg-border",
        )}
        onClick={() => {
          haptic("tick");
          onChange(!on);
        }}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
            on ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

function quietSummary(from: number | null, to: number | null): string {
  if (from == null && to == null) {
    return "Не заданы";
  }
  const start = from == null ? "…" : (QUIET_HOURS[from] ?? `${from}:00`);
  const end = to == null ? "…" : (QUIET_HOURS[to] ?? `${to}:00`);
  return `${start}–${end}`;
}

const QUIET_HOURS = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
] as const;

function HourSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number | null;
  onChange: (hour: number | null) => void;
}) {
  return (
    <select
      id={id}
      className="field-control h-12 w-full appearance-none rounded-xl border border-input/70 bg-input-bg px-3 text-base"
      value={value == null ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === "" ? null : Number.parseInt(raw, 10));
      }}
    >
      <option value="">—</option>
      {QUIET_HOURS.map((label) => (
        <option key={label} value={Number.parseInt(label, 10)}>
          {label}
        </option>
      ))}
    </select>
  );
}
