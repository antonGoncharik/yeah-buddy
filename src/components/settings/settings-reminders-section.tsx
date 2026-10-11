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
}: {
  form: SettingsFormState;
  now: Date | null;
  error: string | null;
  showGoals: boolean;
  onTimezone: (timezone: string) => void;
  onReminderHour: (hour: number) => void;
  onReminders: (enabled: boolean) => void;
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
      {error && !showGoals ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </section>
  );
}
