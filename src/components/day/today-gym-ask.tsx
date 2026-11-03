"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api-cache";
import { programApplyConfirmMessage } from "@/lib/share/program-start";
import { haptic } from "@/lib/telegram/haptic";
import type { DayType } from "@/lib/types";
import type { HubSessionState } from "@/lib/workout/hub-payload";
import type { ProgramPresetId } from "@/lib/workout/program-preset-data";
import { programPresetById } from "@/lib/workout/program-preset-utils";

const ASKED_KEY = "yb.gym-asked";

const STARTER_PRESETS: ProgramPresetId[] = [
  "full_body",
  "home_glutes",
  "five_by_five",
  "ppl",
];

function askedToday(date: string): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  return localStorage.getItem(ASKED_KEY) === date;
}

function rememberAsked(date: string): void {
  localStorage.setItem(ASKED_KEY, date);
}

export function TodayGymAsk({
  date,
  busy,
  peek,
  onSwitchType,
}: {
  date: string;
  busy: boolean;
  peek: HubSessionState | null;
  onSwitchType: (dayType: DayType) => Promise<void>;
}) {
  const confirm = useConfirm();
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    setAsked(askedToday(date));
  }, [date]);
  const [showPresets, setShowPresets] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (asked && !showPresets) {
    return null;
  }

  const queueEmpty = peek != null && !peek.session && !peek.nextTemplate;

  async function answer(dayType: DayType) {
    haptic("tap");
    rememberAsked(date);
    setAsked(true);
    await onSwitchType(dayType);
    setShowPresets(dayType === "training");
  }

  async function apply(presetId: ProgramPresetId) {
    const preset = programPresetById(presetId);
    if (!preset || saving) {
      return;
    }
    const ok = await confirm({
      message: programApplyConfirmMessage(preset),
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setSaving(true);
    try {
      await postJson("/api/templates/presets", { preset: presetId });
      haptic("success");
      setApplied(preset.name);
      setShowPresets(false);
    } catch {
      haptic("error");
    } finally {
      setSaving(false);
    }
  }

  if (showPresets && queueEmpty && !applied) {
    return (
      <div className="card-surface flex flex-col gap-2 px-4 py-4">
        <p className="text-base font-medium">Выбери программу</p>
        {STARTER_PRESETS.map((id) => {
          const preset = programPresetById(id);
          if (!preset) {
            return null;
          }
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              className="h-12 w-full text-base"
              disabled={saving || busy}
              onClick={() => void apply(id)}
            >
              {preset.name}
            </Button>
          );
        })}
      </div>
    );
  }

  if (applied) {
    return (
      <p className="px-1 text-base text-muted-foreground">
        Поставил «{applied}». Очередь на месте.
      </p>
    );
  }

  if (asked) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-lg font-medium">Сегодня зал?</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          className="h-12 text-base"
          disabled={busy}
          onClick={() => void answer("training")}
        >
          Да
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 text-base"
          disabled={busy}
          onClick={() => void answer("rest")}
        >
          Нет
        </Button>
      </div>
    </div>
  );
}
