"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSet,
} from "@/lib/types";
import {
  PHASE_TYPE_LABELS,
  SESSION_STATUS_LABELS,
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

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
      const next = readDetail(data);
      setDetail(next);
      setDrafts(next ? draftsFromDetail(next) : {});
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

  async function complete() {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/${detail.session.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sets: Object.entries(drafts).map(([id, draft]) => ({
              id,
              actual_weight: parseDecimal(draft.weight),
              actual_reps:
                detail.session.workout_type === "dynamic"
                  ? parseInteger(draft.reps)
                  : null,
              actual_seconds:
                detail.session.workout_type === "static"
                  ? parseDecimal(draft.seconds)
                  : null,
            })),
          }),
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const next = readDetail(data);
      if (next) {
        setDetail(next);
        setDrafts(draftsFromDetail(next));
        setOpenId(null);
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
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
                {detail.template?.name ??
                  WORKOUT_KIND_LABELS[session.workout_type]}
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
                В шаблоне нет упражнений с максимумом. Добавьте упражнения в
                шаблон.
              </p>
            ) : null}

            {detail.exercises.map((item) => (
              <ExerciseCard
                key={item.id}
                item={item}
                kind={session.workout_type}
                open={openId === item.id}
                disabled={busy || session.status === "skipped"}
                drafts={drafts}
                onToggle={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
                onDraft={(setId, patch) =>
                  setDrafts((current) => ({
                    ...current,
                    [setId]: { ...current[setId], ...patch },
                  }))
                }
              />
            ))}

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
              <>
                {session.status !== "completed" ? (
                  <Button
                    type="button"
                    className="h-14 text-lg"
                    disabled={busy || detail.exercises.length === 0}
                    onClick={() => void complete()}
                  >
                    Сделал как в плане
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  className="h-14 text-lg"
                  disabled={busy}
                  onClick={() => void setStatus("skipped")}
                >
                  Пропустить
                </Button>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

type SetDraft = {
  weight: string;
  reps: string;
  seconds: string;
};

function ExerciseCard({
  item,
  kind,
  open,
  disabled,
  drafts,
  onToggle,
  onDraft,
}: {
  item: SessionExerciseDetail;
  kind: "dynamic" | "static";
  open: boolean;
  disabled: boolean;
  drafts: Record<string, SetDraft>;
  onToggle: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
}) {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <button
        type="button"
        className="flex flex-col items-start gap-1 text-left"
        onClick={onToggle}
        disabled={disabled}
      >
        <h3 className="text-lg font-semibold">
          {item.exercise.short_name || item.exercise.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          максимум {formatWeight(item.max_weight)} кг
        </p>
        {warmup.length > 0 ? (
          <p className="text-base">
            <span className="text-muted-foreground">разминка </span>
            {formatSetLine(warmup, kind)}
          </p>
        ) : null}
        {work.length > 0 ? (
          <p className="text-lg font-semibold">{formatSetLine(work, kind)}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {open ? "Скрыть правку" : "Изменить веса"}
        </p>
      </button>

      {open
        ? item.sets.map((set) => {
            const draft = drafts[set.id] ?? draftFromSet(set);
            return (
              <div
                key={set.id}
                className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 px-3 py-3"
              >
                <Input
                  inputMode="decimal"
                  value={draft.weight}
                  disabled={disabled}
                  onChange={(event) =>
                    onDraft(set.id, { weight: event.target.value })
                  }
                  className="h-11 text-base"
                  aria-label="Вес"
                />
                {kind === "dynamic" ? (
                  <Input
                    inputMode="numeric"
                    value={draft.reps}
                    disabled={disabled}
                    onChange={(event) =>
                      onDraft(set.id, { reps: event.target.value })
                    }
                    className="h-11 text-base"
                    aria-label="Повторения"
                  />
                ) : (
                  <Input
                    inputMode="decimal"
                    value={draft.seconds}
                    disabled={disabled}
                    onChange={(event) =>
                      onDraft(set.id, { seconds: event.target.value })
                    }
                    className="h-11 text-base"
                    aria-label="Секунды"
                  />
                )}
              </div>
            );
          })
        : null}
    </section>
  );
}

function formatSetLine(sets: WorkoutSet[], kind: "dynamic" | "static"): string {
  return sets
    .map((set) => {
      const weight =
        set.planned_weight == null
          ? "—"
          : `${formatWeight(set.planned_weight)}`;
      if (kind === "dynamic") {
        return `${weight}×${set.planned_reps ?? "—"}`;
      }

      return `${weight}×${
        set.planned_seconds == null
          ? "—"
          : `${formatSeconds(set.planned_seconds)}с`
      }`;
    })
    .join(" / ");
}

function draftsFromDetail(detail: SessionDetail): Record<string, SetDraft> {
  const next: Record<string, SetDraft> = {};
  for (const item of detail.exercises) {
    for (const set of item.sets) {
      next[set.id] = draftFromSet(set);
    }
  }

  return next;
}

function draftFromSet(set: WorkoutSet): SetDraft {
  return {
    weight: toDraft(set.actual_weight ?? set.planned_weight),
    reps: toDraft(set.actual_reps ?? set.planned_reps),
    seconds: toDraft(set.actual_seconds ?? set.planned_seconds),
  };
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
