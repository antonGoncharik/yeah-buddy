"use client";

import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { cachedGet, patchJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { type PauseDays, pauseCovers } from "@/lib/retention/pause";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type { UserSettings } from "@/lib/types";

const CHOICES: Array<{ days: PauseDays; label: string }> = [
  { days: 3, label: "3 дня" },
  { days: 7, label: "Неделя" },
  { days: 14, label: "Две недели" },
];

export function SettingsPauseSection() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = calendarToday();

  useEffect(() => {
    let cancelled = false;
    void cachedGet("/api/settings", (data) => {
      if (!cancelled) {
        setSettings(readSettingsPayload(data));
      }
      return true;
    }).catch(() => {
      if (!cancelled) {
        setError("Пауза не открылась.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(days: PauseDays | null) {
    setBusy(true);
    setError(null);
    try {
      const data = await patchJson("/api/settings", { pause_days: days });
      const next = readSettingsPayload(data);
      if (next) {
        setSettings(next);
      }
      haptic("commit");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : "Не сохранилось.");
    } finally {
      setBusy(false);
    }
  }

  const active =
    settings != null &&
    pauseCovers(today, settings.pause_from, settings.pause_until);

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Пауза" />
      <p className="text-base leading-relaxed text-muted-foreground">
        Отпуск или болезнь: серия не сгорает, вечерние напоминания молчат. Когда
        вернёшься, предложим первую тренировку легче на 10%.
      </p>
      {active && settings?.pause_until ? (
        <p className="text-base">
          До {formatIsoDate(settings.pause_until, "d MMMM")}. Напоминания
          молчат.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {CHOICES.map((choice) => (
          <Button
            key={choice.days}
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => void save(choice.days)}
          >
            {choice.label}
          </Button>
        ))}
        {active ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={busy}
            onClick={() => void save(null)}
          >
            Снять
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-base text-destructive">{error}</p> : null}
    </section>
  );
}
