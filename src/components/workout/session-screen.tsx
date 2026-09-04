"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSet,
} from "@/lib/types";
import { PHASE_TYPE_LABELS, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
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

    if (status === "skipped" && !window.confirm("Пропустить эту тренировку?")) {
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
  const title =
    detail?.template?.name ??
    (session ? WORKOUT_KIND_LABELS[session.workout_type] : "Тренировка");
  const subtitle = session
    ? [
        formatSessionDate(session.session_date),
        detail?.phase ? PHASE_TYPE_LABELS[detail.phase.phase_type] : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  const showStickyComplete = session?.status === "planned";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={title} subtitle={subtitle} backHref="/workouts" />

      <div
        className={
          showStickyComplete
            ? "flex flex-col gap-5 px-4 pb-24"
            : "flex flex-col gap-5 px-4 pb-4"
        }
      >
        {loading ? (
          <p className="animate-fade py-12 text-center text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error && !detail ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
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
            {detail.exercises.length === 0 ? (
              <p className="text-base leading-relaxed text-muted-foreground">
                В шаблоне нет упражнений с максимумом.
              </p>
            ) : (
              <section className="card-surface animate-rise overflow-hidden">
                {detail.exercises.map((item) => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    kind={session.workout_type}
                    open={openId === item.id}
                    disabled={busy || session.status === "skipped"}
                    showActual={session.status === "completed"}
                    drafts={drafts}
                    onToggle={() =>
                      setOpenId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    onDraft={(setId, patch) =>
                      setDrafts((current) => ({
                        ...current,
                        [setId]: { ...current[setId], ...patch },
                      }))
                    }
                  />
                ))}
              </section>
            )}

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
            ) : null}

            {session.status === "planned" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void setStatus("skipped")}
              >
                Пропустить
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9] mx-auto max-w-lg bg-gradient-to-t from-background from-40% to-transparent px-4 pt-8 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="pointer-events-auto h-14 w-full text-lg"
            disabled={busy || detail.exercises.length === 0}
            onClick={() => void complete()}
          >
            Сделал как в плане
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type SetDraft = {
  weight: string;
  reps: string;
  seconds: string;
};

function ExerciseRow({
  item,
  kind,
  open,
  disabled,
  showActual,
  drafts,
  onToggle,
  onDraft,
}: {
  item: SessionExerciseDetail;
  kind: "dynamic" | "static";
  open: boolean;
  disabled: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  onToggle: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
}) {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        className="flex w-full flex-col items-start gap-2.5 px-5 py-4 text-left"
        onClick={onToggle}
        disabled={disabled}
      >
        <div className="flex w-full items-baseline justify-between gap-3">
          <h3 className="truncate text-lg font-semibold">
            {item.exercise.short_name || item.exercise.name}
          </h3>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatWeight(item.max_weight)} кг
          </span>
        </div>
        {warmup.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {warmup.map((set) => (
              <StatusPill key={set.id}>
                {formatSetChip(set, kind, showActual)}
              </StatusPill>
            ))}
          </div>
        ) : null}
        {work.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {work.map((set) => (
              <StatusPill key={set.id} tone="strong">
                {formatSetChip(set, kind, showActual)}
              </StatusPill>
            ))}
          </div>
        ) : null}
      </button>

      {open ? (
        <div className="flex flex-col gap-2 px-5 pb-4">
          {item.sets.map((set) => {
            const draft = drafts[set.id] ?? draftFromSet(set);
            return (
              <div
                key={set.id}
                className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 px-3 py-3"
              >
                <FieldInput
                  label="кг"
                  value={draft.weight}
                  disabled={disabled}
                  inputMode="decimal"
                  onChange={(value) => onDraft(set.id, { weight: value })}
                />
                {kind === "dynamic" ? (
                  <FieldInput
                    label="раз"
                    value={draft.reps}
                    disabled={disabled}
                    inputMode="numeric"
                    onChange={(value) => onDraft(set.id, { reps: value })}
                  />
                ) : (
                  <FieldInput
                    label="сек"
                    value={draft.seconds}
                    disabled={disabled}
                    inputMode="decimal"
                    onChange={(value) => onDraft(set.id, { seconds: value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FieldInput({
  label,
  value,
  disabled,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  inputMode: "decimal" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 text-base"
        aria-label={label}
      />
    </div>
  );
}

function formatSessionDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMMM", { locale: ru });
  } catch {
    return isoDate;
  }
}

function formatSetChip(
  set: WorkoutSet,
  kind: "dynamic" | "static",
  showActual: boolean,
): string {
  const weightValue = showActual
    ? (set.actual_weight ?? set.planned_weight)
    : set.planned_weight;
  const weight = weightValue == null ? "—" : formatWeight(weightValue);
  if (kind === "dynamic") {
    const reps = showActual
      ? (set.actual_reps ?? set.planned_reps)
      : set.planned_reps;
    return `${weight}×${reps ?? "—"}`;
  }

  const secondsValue = showActual
    ? (set.actual_seconds ?? set.planned_seconds)
    : set.planned_seconds;
  return `${weight}×${
    secondsValue == null ? "—" : `${formatSeconds(secondsValue)}с`
  }`;
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
