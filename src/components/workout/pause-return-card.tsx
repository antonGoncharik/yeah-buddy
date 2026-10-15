"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { pauseReturnDue } from "@/lib/retention/pause";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type { UserSettings } from "@/lib/types";

export function PauseReturnCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [busy, setBusy] = useState(false);

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
    !settings ||
    !pauseReturnDue(
      calendarToday(),
      settings.pause_until,
      settings.pause_return_pending,
    )
  ) {
    return null;
  }

  async function answer(action: "lighten" | "keep") {
    setBusy(true);
    try {
      const data = await patchJson("/api/settings", { pause_return: action });
      writeJson("/api/settings", data);
      const next = readSettingsPayload(data);
      setSettings(next);
      haptic("commit");
    } catch {
      haptic("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-muted/50 px-4 py-4">
      <p className="text-base leading-snug">
        Пауза кончилась. Первая тренировка может быть легче на 10%, чтобы не
        рвать после перерыва.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="h-12 text-base"
          disabled={busy}
          onClick={() => void answer("lighten")}
        >
          Облегчить на 10%
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          disabled={busy}
          onClick={() => void answer("keep")}
        >
          Оставить веса
        </Button>
      </div>
    </section>
  );
}
