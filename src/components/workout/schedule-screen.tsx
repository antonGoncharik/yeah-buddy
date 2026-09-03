"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { ScheduleWorkoutType, WorkoutScheduleDay } from "@/lib/types";
import {
  SCHEDULE_TYPE_LABELS,
  WEEKDAY_FULL_LABELS,
} from "@/lib/workout/labels";

const TYPES: ScheduleWorkoutType[] = ["dynamic", "static", "rest"];

export function ScheduleScreen() {
  const [days, setDays] = useState<WorkoutScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/schedule");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setDays(readDays(data));
    } catch {
      setError(LOAD_FAILED);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setDayType(dayOfWeek: number, workoutType: ScheduleWorkoutType) {
    setSaved(false);
    setDays((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek
          ? { ...day, workout_type: workoutType }
          : day,
      ),
    );
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: days.map((day) => ({
            day_of_week: day.day_of_week,
            workout_type: day.workout_type,
          })),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setDays(readDays(data));
      setSaved(true);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Расписание" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error && days.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && days.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Расписание можно менять на лету. Если потренировались в другой
              день — создайте тренировку вручную, план не сломается.
            </p>
            {days.map((day) => (
              <section
                key={day.id}
                className="card-surface flex flex-col gap-3 px-5 py-4"
              >
                <h2 className="text-lg font-medium">
                  {WEEKDAY_FULL_LABELS[day.day_of_week]}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={
                        day.workout_type === type ? "default" : "outline"
                      }
                      className="h-11 text-sm"
                      onClick={() => setDayType(day.day_of_week, type)}
                    >
                      {SCHEDULE_TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </section>
            ))}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="text-sm text-muted-foreground">Сохранено.</p>
            ) : null}

            <Button
              type="button"
              className="h-14 text-lg"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function readDays(data: unknown): WorkoutScheduleDay[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("days" in data) ||
    !Array.isArray(data.days)
  ) {
    return [];
  }

  return data.days as WorkoutScheduleDay[];
}
