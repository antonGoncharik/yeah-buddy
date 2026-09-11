"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  kcalFromFields,
  type MacroFieldKey,
  readSettings,
  type SettingsFormState,
  toFormState,
  toPayload,
} from "@/components/settings/settings-form-state";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import { useFirstLoad } from "@/lib/use-first-load";

export function useSettingsScreen() {
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);
    setSaved(false);

    try {
      await cachedGet(
        "/api/settings",
        (data) => {
          const settings = readSettings(data);
          if (!settings) {
            return false;
          }
          setForm(toFormState(settings));
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setForm(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  const restKcal = useMemo(
    () => kcalFromFields(form?.rest_protein, form?.rest_fat, form?.rest_carbs),
    [form?.rest_carbs, form?.rest_fat, form?.rest_protein],
  );
  const trainingKcal = useMemo(
    () =>
      kcalFromFields(
        form?.training_protein,
        form?.training_fat,
        form?.training_carbs,
      ),
    [form?.training_carbs, form?.training_fat, form?.training_protein],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) {
      return;
    }

    const payload = toPayload(form);
    if (!payload) {
      setError(CHECK_FIELDS);
      setSaved(false);
      return;
    }

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const data = await patchJson("/api/settings", payload);
      const settings = readSettings(data);
      if (settings) {
        setForm(toFormState(settings));
        writeJson("/api/settings", data);
      }
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function updateField(key: MacroFieldKey, value: string) {
    setSaved(false);
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function setReminders(enabled: boolean) {
    if (!form || form.reminders_enabled === enabled) {
      return;
    }

    const previous = form.reminders_enabled;
    setForm({ ...form, reminders_enabled: enabled });
    setError(null);

    try {
      const data = await patchJson("/api/settings", {
        reminders_enabled: enabled,
      });
      const settings = readSettings(data);
      if (settings) {
        setForm((current) =>
          current
            ? { ...current, reminders_enabled: settings.reminders_enabled }
            : current,
        );
        writeJson("/api/settings", data);
      }
    } catch (caught) {
      setForm((current) =>
        current ? { ...current, reminders_enabled: previous } : current,
      );
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  return {
    form,
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
    setReminders,
  };
}
