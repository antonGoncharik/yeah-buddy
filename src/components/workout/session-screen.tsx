"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { SessionDetail, WorkoutSet } from "@/lib/types";
import {
  PHASE_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  SET_TYPE_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import {
  formatSeconds,
  formatWeight,
  parseDecimal,
} from "@/lib/workout/numbers";

export function SessionScreen() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${params.id}`);
      if (response.status === 404) {
        setError("Тренировка не найдена.");
        setDetail(null);
        return;
      }
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setDetail(readDetail(data));
    } catch {
      setError(LOAD_FAILED);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyDetail(response: Response) {
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      setError(readApiError(data) ?? LOAD_FAILED);
      return false;
    }

    const next = readDetail(data);
    if (next) {
      setDetail(next);
    }
    return true;
  }

  async function setStatus(status: "skipped" | "planned") {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${detail.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      await load();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function addExercise(exerciseId: string) {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/${detail.session.id}/exercises`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercise_id: exerciseId }),
        },
      );
      await applyDetail(response);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function removeExercise(sessionExerciseId: string) {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
        { method: "DELETE" },
      );
      await applyDetail(response);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function saveSet(
    setId: string,
    payload: {
      actual_weight: number | null;
      actual_reps: number | null;
      actual_seconds: number | null;
      is_completed: boolean;
    },
  ) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await applyDetail(response);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const session = detail?.session;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировка" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error && !detail ? (
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

        {!loading && session && detail ? (
          <>
            <section className="card-surface flex flex-col gap-2 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                {session.session_date}
              </p>
              <h2 className="text-2xl font-semibold">
                {WORKOUT_KIND_LABELS[session.workout_type]}
              </h2>
              <p className="text-base text-muted-foreground">
                {SESSION_STATUS_LABELS[session.status]}
                {detail.phase
                  ? ` · ${PHASE_TYPE_LABELS[detail.phase.phase_type]}`
                  : ""}
              </p>
            </section>

            {detail.exercises.length === 0 ? (
              <p className="text-base text-muted-foreground">
                Нет упражнений с максимумом в этой фазе. Добавьте упражнение
                вручную.
              </p>
            ) : null}

            {detail.exercises.map((item) => (
              <section
                key={item.id}
                className="card-surface flex flex-col gap-3 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {item.exercise.short_name || item.exercise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      максимум {formatWeight(item.max_weight)} кг
                    </p>
                  </div>
                  {item.sets.every((set) => !set.is_completed) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 text-sm"
                      disabled={busy}
                      onClick={() => void removeExercise(item.id)}
                    >
                      Убрать
                    </Button>
                  ) : null}
                </div>

                {item.sets.map((set) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    kind={session.workout_type}
                    disabled={busy || session.status === "skipped"}
                    onSave={(payload) => void saveSet(set.id, payload)}
                  />
                ))}
              </section>
            ))}

            {detail.available_exercises.length > 0 &&
            session.status !== "skipped" ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Добавить упражнение</h2>
                {detail.available_exercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    type="button"
                    variant="outline"
                    className="h-12 justify-start text-base"
                    disabled={busy}
                    onClick={() => void addExercise(exercise.id)}
                  >
                    {exercise.short_name || exercise.name}
                  </Button>
                ))}
              </section>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "skipped" ? (
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={busy}
                onClick={() => void setStatus("planned")}
              >
                Вернуть в план
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="h-14 text-lg"
                disabled={busy}
                onClick={() => void setStatus("skipped")}
              >
                Пропустить
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function SetRow({
  set,
  kind,
  disabled,
  onSave,
}: {
  set: WorkoutSet;
  kind: "dynamic" | "static";
  disabled: boolean;
  onSave: (payload: {
    actual_weight: number | null;
    actual_reps: number | null;
    actual_seconds: number | null;
    is_completed: boolean;
  }) => void;
}) {
  const [weight, setWeight] = useState(
    toDraft(set.actual_weight ?? set.planned_weight),
  );
  const [reps, setReps] = useState(
    toDraft(set.actual_reps ?? set.planned_reps),
  );
  const [seconds, setSeconds] = useState(
    toDraft(set.actual_seconds ?? set.planned_seconds),
  );

  useEffect(() => {
    setWeight(toDraft(set.actual_weight ?? set.planned_weight));
    setReps(toDraft(set.actual_reps ?? set.planned_reps));
    setSeconds(toDraft(set.actual_seconds ?? set.planned_seconds));
  }, [set]);

  const planned =
    kind === "dynamic"
      ? `${formatMaybeWeight(set.planned_weight)} × ${set.planned_reps ?? "—"}`
      : `${formatMaybeWeight(set.planned_weight)} × ${
          set.planned_seconds == null
            ? "—"
            : `${formatSeconds(set.planned_seconds)}с`
        }`;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {SET_TYPE_LABELS[set.set_type]} {set.set_number}
        </p>
        <p className="text-sm text-muted-foreground">план {planned}</p>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input
          inputMode="decimal"
          value={weight}
          disabled={disabled || set.is_completed}
          onChange={(event) => setWeight(event.target.value)}
          className="h-11 text-base"
          aria-label="Вес"
        />
        {kind === "dynamic" ? (
          <Input
            inputMode="numeric"
            value={reps}
            disabled={disabled || set.is_completed}
            onChange={(event) => setReps(event.target.value)}
            className="h-11 text-base"
            aria-label="Повторения"
          />
        ) : (
          <Input
            inputMode="decimal"
            value={seconds}
            disabled={disabled || set.is_completed}
            onChange={(event) => setSeconds(event.target.value)}
            className="h-11 text-base"
            aria-label="Секунды"
          />
        )}
        <Button
          type="button"
          variant={set.is_completed ? "secondary" : "default"}
          className="h-11 px-3 text-sm"
          disabled={disabled}
          onClick={() =>
            onSave({
              actual_weight: parseDecimal(weight),
              actual_reps: kind === "dynamic" ? parseInteger(reps) : null,
              actual_seconds: kind === "static" ? parseDecimal(seconds) : null,
              is_completed: !set.is_completed,
            })
          }
        >
          {set.is_completed ? "Снять" : "Готово"}
        </Button>
      </div>
    </div>
  );
}

function formatMaybeWeight(value: number | null): string {
  return value == null ? "—" : `${formatWeight(value)} кг`;
}

function toDraft(value: number | null): string {
  if (value == null) {
    return "";
  }

  return formatWeight(value);
}

function parseInteger(raw: string): number | null {
  const value = parseDecimal(raw);
  if (value == null) {
    return null;
  }

  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

function readDetail(data: unknown): SessionDetail | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data as SessionDetail;
}
