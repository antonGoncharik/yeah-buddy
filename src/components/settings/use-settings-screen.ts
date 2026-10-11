"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  kcalFromFields,
  type MacroFieldKey,
  readSettings,
  type SettingsFormState,
  toFormState,
  toPayload,
  withRecountedProtein,
} from "@/components/settings/settings-form-state";
import { patchSettingsField } from "@/components/settings/settings-optimistic-patch";
import { cachedGet, mutateJson, patchJson, writeJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { readDay, readLastBodyWeight } from "@/lib/day/today-payload";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import type { OnboardingGoal, OnboardingSex } from "@/lib/nutrition";
import type {
  UserActivityLevel,
  UserGoalPace,
  UserTrainingAge,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

export function useSettingsScreen() {
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [bodyWeight, setBodyWeight] = useState<number | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  const loadWeight = useCallback(async () => {
    try {
      const data = await mutateJson(`/api/days?date=${calendarToday()}`);
      const day = readDay(data);
      const weight = day?.body_weight ?? readLastBodyWeight(data);
      setBodyWeight(weight != null && weight > 0 ? weight : null);
    } catch {
      setBodyWeight(null);
    }
  }, []);

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
      void loadWeight();
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setForm(null);
      done(false);
    }
  }, [begin, done, loadWeight]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (showGoals) {
      void loadWeight();
    }
  }, [showGoals, loadWeight]);

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

  function updateSex(value: OnboardingSex) {
    setSaved(false);
    setError(null);
    setForm((current) => {
      if (!current) {
        return current;
      }
      const next = { ...current, sex: value };
      if (bodyWeight == null) {
        return next;
      }
      return withRecountedProtein(next, bodyWeight) ?? next;
    });
  }

  function updateGoal(value: OnboardingGoal) {
    setSaved(false);
    setError(null);
    setForm((current) => {
      if (!current) {
        return current;
      }
      const next = {
        ...current,
        goal: value,
        goal_pace: value === "keep" ? null : (current.goal_pace ?? "normal"),
      };
      if (bodyWeight == null) {
        return next;
      }
      return withRecountedProtein(next, bodyWeight) ?? next;
    });
  }

  function updateTrainingAge(value: UserTrainingAge) {
    setSaved(false);
    setError(null);
    setForm((current) =>
      current ? { ...current, training_age: value } : current,
    );
  }

  function updateActivity(value: UserActivityLevel) {
    setSaved(false);
    setError(null);
    setForm((current) =>
      current ? { ...current, activity_level: value } : current,
    );
  }

  function updateGoalPace(value: UserGoalPace | null) {
    setSaved(false);
    setError(null);
    setForm((current) =>
      current ? { ...current, goal_pace: value } : current,
    );
  }

  function onRecount() {
    setSaved(false);
    setError(null);
    setForm((current) => {
      if (!current || bodyWeight == null) {
        return current;
      }
      return withRecountedProtein(current, bodyWeight) ?? current;
    });
  }

  async function setReminders(enabled: boolean) {
    if (!form) {
      return;
    }
    await patchSettingsField({
      form,
      key: "reminders_enabled",
      value: enabled,
      setForm,
      setError,
    });
  }

  async function setGymEnabled(enabled: boolean) {
    if (!form) {
      return;
    }
    await patchSettingsField({
      form,
      key: "gym_enabled",
      value: enabled,
      setForm,
      setError,
    });
  }

  async function setReminderHour(hour: number) {
    if (!form) {
      return;
    }
    await patchSettingsField({
      form,
      key: "reminder_hour",
      value: hour,
      setForm,
      setError,
    });
  }

  async function setTimezone(timezone: string) {
    if (!form) {
      return;
    }
    await patchSettingsField({
      form,
      key: "timezone",
      value: timezone,
      setForm,
      setError,
    });
  }

  return {
    form,
    bodyWeight,
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
  };
}
