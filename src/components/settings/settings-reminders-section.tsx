"use client";

import { ChevronRight } from "lucide-react";

import type { SettingsFormState } from "@/components/settings/settings-form-state";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EARLY_HABIT_REMINDER_NOTE } from "@/lib/messages";
import {
  timezoneCaption,
  timezoneChoiceLabel,
  timezoneChoicesFor,
} from "@/lib/telegram/timezone-label";

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
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Напоминания</h2>
      <p className="text-sm text-muted-foreground">
        {EARLY_HABIT_REMINDER_NOTE}
      </p>
      <p className="text-sm text-muted-foreground">
        {now
          ? timezoneCaption(form.timezone, now)
          : timezoneChoiceLabel(form.timezone)}
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Пояс</span>
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
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">
          Вечернее напоминание
        </span>
        <select
          className="field-control h-12 w-full appearance-none rounded-xl border border-input/70 bg-input-bg px-3 text-base"
          value={String(form.reminder_hour)}
          onChange={(event) =>
            onReminderHour(Number.parseInt(event.target.value, 10))
          }
        >
          {Array.from({ length: 7 }, (_, index) => 17 + index).map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>
      </label>
      <Segmented
        value={form.reminders_enabled ? "on" : "off"}
        options={[
          { id: "on", label: "Вкл" },
          { id: "off", label: "Выкл" },
        ]}
        onChange={(id) => onReminders(id === "on")}
      />
      <NoticeToggle
        label="Недельный дайджест"
        hint="Понедельник, 9:00"
        on={form.weekly_digest_enabled}
        onChange={onWeeklyDigest}
      />
      <NoticeToggle
        label="Месячный отчёт"
        hint="1-е число, 9:00"
        on={form.monthly_report_enabled}
        onChange={onMonthlyReport}
      />
      <NoticeToggle
        label="Рекорды в чат"
        hint="После тренировки, если подход сильнее прошлого"
        on={form.pr_push_enabled}
        onChange={onPrPush}
      />
      <NoticeToggle
        label="Взвешивание"
        hint="8:00, если два дня без веса"
        on={form.weigh_in_enabled}
        onChange={onWeighIn}
      />
      <NoticeToggle
        label="Серия"
        hint="20:00, если неделю записывал и сегодня пусто"
        on={form.streak_reminder_enabled}
        onChange={onStreak}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Тихие часы</span>
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
            <label htmlFor="quiet-to" className="text-sm text-muted-foreground">
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
      {error && !showGoals ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </section>
  );
}

function NoticeToggle({
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
      <div>
        <p className="text-base font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="w-40 shrink-0">
        <Segmented
          value={on ? "on" : "off"}
          options={[
            { id: "on", label: "Вкл" },
            { id: "off", label: "Выкл" },
          ]}
          onChange={(id) => onChange(id === "on")}
        />
      </div>
    </div>
  );
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
