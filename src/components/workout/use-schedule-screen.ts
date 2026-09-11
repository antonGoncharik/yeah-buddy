"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { patchJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { readTemplates } from "@/lib/workout/hub-payload";
import {
  type ProgramPresetId,
  programPresetById,
} from "@/lib/workout/program-presets";

export function useScheduleScreen() {
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);

  const active = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );
  const inactive = useMemo(
    () => templates.filter((template) => !template.is_active),
    [templates],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setTemplates(readTemplates(data));
    } catch {
      setError(LOAD_FAILED);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: WorkoutTemplateDetail[]) {
    setSaving(true);
    setError(null);

    try {
      const data = await patchJson("/api/templates", {
        rotation: next.map((template, index) => ({
          id: template.id,
          sort_order: (index + 1) * 10,
          is_active: template.is_active,
        })),
      });
      setTemplates(readTemplates(data));
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function persist(
    nextActive: WorkoutTemplateDetail[],
    nextInactive: WorkoutTemplateDetail[],
  ) {
    const next = [...nextActive, ...nextInactive];
    setTemplates(next);
    void save(next);
  }

  async function applyPreset(presetId: ProgramPresetId) {
    const preset = programPresetById(presetId);
    if (!preset) {
      return;
    }
    const ok = await confirm({
      message: `Поставить «${preset.name}»? Очередь станет этой программой. Свои тренировки не удалятся — отложатся.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await postJson("/api/templates/presets", {
        preset: presetId,
      });
      setTemplates(readTemplates(data));
      haptic("success");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function setInCircle(id: string, inCircle: boolean) {
    if (inCircle) {
      const template = inactive.find((item) => item.id === id);
      if (!template) {
        return;
      }
      persist(
        [...active, { ...template, is_active: true }],
        inactive.filter((item) => item.id !== id),
      );
      return;
    }

    const template = active.find((item) => item.id === id);
    if (!template) {
      return;
    }
    persist(
      active.filter((item) => item.id !== id),
      [{ ...template, is_active: false }, ...inactive],
    );
  }

  return {
    active,
    inactive,
    loading,
    error,
    saving,
    showPrograms,
    setShowPrograms,
    load,
    persist,
    applyPreset,
    setInCircle,
  };
}
