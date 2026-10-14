"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { pauseCovers } from "@/lib/retention/pause";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type { UserSettings } from "@/lib/types";

export function TodayPauseBanner() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const today = calendarToday();

  useEffect(() => {
    let cancelled = false;
    void cachedGet("/api/settings", (data) => {
      if (!cancelled) {
        setSettings(readSettingsPayload(data));
      }
      return true;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (
    !settings?.pause_until ||
    !pauseCovers(today, settings.pause_from, settings.pause_until)
  ) {
    return null;
  }

  async function clearPause() {
    setBusy(true);
    try {
      const data = await patchJson("/api/settings", { pause_days: null });
      writeJson("/api/settings", data);
      setSettings(readSettingsPayload(data));
      haptic("commit");
    } catch {
      haptic("error");
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-muted/50 px-4 py-3">
      <p className="text-base leading-snug">
        На паузе до {formatIsoDate(settings.pause_until, "d MMMM")}. Серия
        сохранена, напоминания молчат.
      </p>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start"
        disabled={busy}
        onClick={() => void clearPause()}
      >
        Вернуться раньше
      </Button>
    </section>
  );
}
