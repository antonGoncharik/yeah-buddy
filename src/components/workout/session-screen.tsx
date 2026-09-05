"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { phaseEndHint, readPhaseCircle } from "@/lib/workout/hints";
import { PHASE_TYPE_LABELS, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import {
  formatSeconds,
  formatWeight,
  parseDecimal,
} from "@/lib/workout/numbers";

export function SessionScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openSetIds, setOpenSetIds] = useState<string[]>([]);
  const [warmupOpen, setWarmupOpen] = useState<Record<string, boolean>>({});
  const [nextName, setNextName] = useState<string | null>(null);
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  const loadFollowUp = useCallback(async (sessionDate: string) => {
    try {
      const response = await fetch(
        `/api/sessions?date=${encodeURIComponent(sessionDate)}`,
      );
      if (!response.ok) {
        setNextName(null);
        setPhaseHint(null);
        return;
      }
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "next_template" in data &&
        data.next_template &&
        typeof data.next_template === "object" &&
        "name" in data.next_template &&
        typeof data.next_template.name === "string"
      ) {
        setNextName(data.next_template.name);
      } else {
        setNextName(null);
      }
      const circle = readPhaseCircle(data);
      setPhaseHint(circle ? phaseEndHint(circle) : null);
    } catch {
      setNextName(null);
      setPhaseHint(null);
    }
  }, []);

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
      setOpenSetIds([]);
      if (next?.session.status === "completed") {
        void loadFollowUp(next.session.session_date);
      } else {
        setNextName(null);
        setPhaseHint(null);
      }
    } catch {
      setError(LOAD_FAILED);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [loadFollowUp, params.id]);

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
        setOpenSetIds([]);
        await loadFollowUp(next.session.session_date);
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function cancelToday() {
    if (!detail) {
      return;
    }

    if (
      !window.confirm(
        "Не получилось? Сессия пропадёт, очередь останется. Можно начать другую сегодня.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${detail.session.id}`, {
        method: "DELETE",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      router.replace("/workouts");
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
                В шаблоне нет упражнений с максимумом — задай его в упражнении.
              </p>
            ) : (
              <section className="card-surface animate-rise overflow-hidden">
                {detail.exercises.map((item) => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    kind={session.workout_type}
                    openSetIds={openSetIds}
                    warmupOpen={Boolean(warmupOpen[item.id])}
                    disabled={busy || session.status === "skipped"}
                    showActual={session.status === "completed"}
                    drafts={drafts}
                    onOpenSets={(ids) =>
                      setOpenSetIds((current) => {
                        const same =
                          current.length === ids.length &&
                          ids.every((id) => current.includes(id));
                        return same ? [] : ids;
                      })
                    }
                    onToggleWarmup={() =>
                      setWarmupOpen((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }))
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

            {session.status === "planned" && detail.exercises.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Тапни подход, если вес или повторы другие.
              </p>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "completed" && nextName ? (
              <Link
                href="/workouts"
                className="text-base font-medium text-primary"
              >
                Дальше в круге: {nextName}
              </Link>
            ) : null}

            {session.status === "completed" && phaseHint ? (
              <Link
                href="/workouts/macro"
                className="text-base leading-snug text-muted-foreground"
              >
                {phaseHint}
              </Link>
            ) : null}

            {session.status === "planned" || session.status === "skipped" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void cancelToday()}
              >
                {session.status === "skipped"
                  ? "Убрать — можно начать другую"
                  : "Не получилось сегодня"}
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
  openSetIds,
  warmupOpen,
  disabled,
  showActual,
  drafts,
  onOpenSets,
  onToggleWarmup,
  onDraft,
}: {
  item: SessionExerciseDetail;
  kind: "dynamic" | "static";
  openSetIds: string[];
  warmupOpen: boolean;
  disabled: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  onOpenSets: (ids: string[]) => void;
  onToggleWarmup: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
}) {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <div className="flex flex-col items-start gap-2.5 px-5 py-4">
        <h3 className="text-xl font-semibold tracking-tight">
          {item.exercise.short_name || item.exercise.name}
        </h3>
        {warmup.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1">
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={onToggleWarmup}
            >
              Разминка
            </button>
            {warmupOpen ? (
              <SetButtons
                sets={warmup}
                kind={kind}
                showActual={showActual}
                disabled={disabled || showActual}
                tone="warmup"
                onPick={onOpenSets}
              />
            ) : null}
          </div>
        ) : null}
        {work.length > 0 ? (
          <SetButtons
            sets={work}
            kind={kind}
            showActual={showActual}
            disabled={disabled || showActual}
            tone="work"
            onPick={onOpenSets}
          />
        ) : null}
      </div>

      {leadSet ? (
        <SetEditor
          set={leadSet}
          kind={kind}
          draft={drafts[leadSet.id] ?? draftFromSet(leadSet)}
          disabled={disabled}
          groupCount={openSets.length}
          onDraft={(patch) => {
            for (const set of openSets) {
              onDraft(set.id, patch);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function SetButtons({
  sets,
  kind,
  showActual,
  disabled,
  tone,
  onPick,
}: {
  sets: WorkoutSet[];
  kind: "dynamic" | "static";
  showActual: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  onPick: (ids: string[]) => void;
}) {
  const labels = sets.map((set) =>
    formatSet(set, kind, showActual, tone === "warmup"),
  );
  const same =
    labels.length > 1 && labels.every((label) => label === labels[0]);

  if (tone === "work" && same) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Работа</span>
        <button
          type="button"
          className="text-left text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums disabled:opacity-60"
          disabled={disabled}
          onClick={() => onPick(sets.map((set) => set.id))}
        >
          {labels[0]}
        </button>
        <button
          type="button"
          className="text-left text-sm text-muted-foreground disabled:opacity-60"
          disabled={disabled}
          onClick={() => onPick(sets.map((set) => set.id))}
        >
          {labels.length} {setCountWord(labels.length)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {tone === "work" ? (
        <span className="text-sm text-muted-foreground">Работа</span>
      ) : null}
      <p
        className={
          tone === "work"
            ? "flex flex-wrap gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight tabular-nums"
            : "flex flex-wrap gap-x-3 gap-y-1 text-base tabular-nums text-muted-foreground"
        }
      >
        {sets.map((set, index) => (
          <button
            key={set.id}
            type="button"
            className="text-left disabled:opacity-60"
            disabled={disabled}
            onClick={() => onPick([set.id])}
          >
            {labels[index]}
          </button>
        ))}
      </p>
    </div>
  );
}

function SetEditor({
  set,
  kind,
  draft,
  disabled,
  groupCount,
  onDraft,
}: {
  set: WorkoutSet;
  kind: "dynamic" | "static";
  draft: SetDraft;
  disabled: boolean;
  groupCount: number;
  onDraft: (patch: Partial<SetDraft>) => void;
}) {
  const title =
    groupCount > 1
      ? `${set.set_type === "warmup" ? "Разминка" : "Работа"} · ${groupCount} ${setCountWord(groupCount)}`
      : `${set.set_type === "warmup" ? "Разминка" : "Работа"} ${set.set_number}`;

  return (
    <div className="grid grid-cols-2 gap-2 px-5 pb-4">
      <div className="col-span-2 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 px-3 py-3">
        <p className="col-span-2 text-sm text-muted-foreground">{title}</p>
        <FieldInput
          label="кг"
          value={draft.weight}
          disabled={disabled}
          inputMode="decimal"
          onChange={(value) => onDraft({ weight: value })}
        />
        {kind === "dynamic" ? (
          <FieldInput
            label="раз"
            value={draft.reps}
            disabled={disabled}
            inputMode="numeric"
            onChange={(value) => onDraft({ reps: value })}
          />
        ) : (
          <FieldInput
            label="сек"
            value={draft.seconds}
            disabled={disabled}
            inputMode="decimal"
            onChange={(value) => onDraft({ seconds: value })}
          />
        )}
      </div>
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

function formatSet(
  set: WorkoutSet,
  kind: "dynamic" | "static",
  showActual: boolean,
  compact = false,
): string {
  const weightValue = showActual
    ? (set.actual_weight ?? set.planned_weight)
    : set.planned_weight;
  const weight = weightValue == null ? "—" : formatWeight(weightValue);
  if (kind === "dynamic") {
    const reps = showActual
      ? (set.actual_reps ?? set.planned_reps)
      : set.planned_reps;
    const repsLabel = reps ?? "—";
    return compact ? `${weight}×${repsLabel}` : `${weight} × ${repsLabel}`;
  }

  const secondsValue = showActual
    ? (set.actual_seconds ?? set.planned_seconds)
    : set.planned_seconds;
  const secondsLabel = secondsValue == null ? "—" : formatSeconds(secondsValue);
  return compact
    ? `${weight}×${secondsLabel}с`
    : `${weight} × ${secondsLabel} с`;
}

function setCountWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "подход";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "подхода";
  }
  return "подходов";
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
