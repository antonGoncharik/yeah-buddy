"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cachedGet, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  ExerciseWithMax,
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSet,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { phaseEndHint, readPhaseCircle } from "@/lib/workout/hints";
import {
  PHASE_TYPE_LABELS,
  SESSION_KIND_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  formatSetLine,
  setUsesSeconds,
  workAbovePlan,
  workSetDiffers,
} from "@/lib/workout/session-format";

export function SessionScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const { loading, begin, done, reset } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openSetIds, setOpenSetIds] = useState<string[]>([]);
  const [warmupOpen, setWarmupOpen] = useState<Record<string, boolean>>({});
  const [nextName, setNextName] = useState<string | null>(null);
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [note, setNote] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState<ExerciseWithMax[] | null>(null);

  const sessionUrl = `/api/sessions/${params.id}`;

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

  const applyDetail = useCallback((next: SessionDetail) => {
    setDetail(next);
    setDrafts(draftsFromDetail(next));
    setNote(next.session.note ?? "");
    setOpenSetIds([]);
  }, []);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        sessionUrl,
        (data) => {
          const next = readDetail(data);
          if (!next) {
            return false;
          }
          applyDetail(next);
          if (
            next.session.status === "completed" &&
            next.session.kind === "gym"
          ) {
            void loadFollowUp(next.session.session_date);
          } else {
            setNextName(null);
            setPhaseHint(null);
          }
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setDetail(null);
      done(false);
    }
  }, [applyDetail, begin, done, loadFollowUp, sessionUrl]);

  useEffect(() => {
    if (params.id.length > 0) {
      reset();
    }
  }, [params.id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  const abovePlan = useMemo(() => {
    if (detail?.session.status !== "completed") {
      return false;
    }
    return detail.exercises.some((item) =>
      item.sets.some((set) => workAbovePlan(set)),
    );
  }, [detail]);

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
            note: note.trim() === "" ? null : note.trim(),
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
        writeJson(sessionUrl, data);
        applyDetail(next);
        if (next.session.kind === "gym") {
          await loadFollowUp(next.session.session_date);
        }
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!detail) {
      return;
    }

    const trimmed = note.trim() === "" ? null : note.trim();
    if (trimmed === (detail.session.note ?? null)) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${detail.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }
      setDetail((current) =>
        current
          ? { ...current, session: { ...current.session, note: trimmed } }
          : current,
      );
    } catch {
      setError(LOAD_FAILED);
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
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const next = readDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
        setPickerOpen(false);
      }
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function openPicker() {
    setPickerOpen((current) => !current);
    if (catalog) {
      return;
    }

    try {
      const response = await fetch("/api/exercises?filter=active");
      if (!response.ok) {
        setError(LOAD_FAILED);
        return;
      }
      const data: unknown = await response.json();
      setCatalog(readExercises(data));
    } catch {
      setError(LOAD_FAILED);
    }
  }

  async function cancelToday() {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message:
        detail.session.kind === "table"
          ? "Убрать стол?"
          : "Убрать тренировку? Очередь останется.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
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
  const isTable = session?.kind === "table";
  const title = isTable
    ? SESSION_KIND_LABELS.table
    : (detail?.template?.name ??
      (session ? WORKOUT_KIND_LABELS[session.workout_type] : "Тренировка"));
  const subtitle = session
    ? [
        formatSessionDate(session.session_date),
        !isTable && detail?.phase
          ? PHASE_TYPE_LABELS[detail.phase.phase_type]
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  const showStickyComplete = session?.status === "planned";
  const addable = useMemo(() => {
    if (!detail || !catalog) {
      return [];
    }
    const taken = new Set(detail.exercises.map((item) => item.exercise_id));
    return catalog.filter((exercise) => {
      if (taken.has(exercise.id) || !exercise.is_active) {
        return false;
      }
      if (exercise.formula_preset === "none") {
        return false;
      }
      if (
        (exercise.current_max?.max_weight ?? 0) <= 0 &&
        detail.session.phase_id == null
      ) {
        return false;
      }
      return (
        exercise.workout_type === "both" ||
        exercise.workout_type === detail.session.workout_type
      );
    });
  }, [catalog, detail]);

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
            {isTable ? null : detail.exercises.length === 0 ? (
              <p className="text-base text-muted-foreground">
                Нет упражнений с максимумом.
              </p>
            ) : (
              <section className="card-surface animate-rise overflow-hidden">
                {detail.exercises.map((item) => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
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

            {session.status === "planned" && !isTable ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 justify-start px-1 text-base text-muted-foreground"
                  disabled={busy}
                  onClick={() => void openPicker()}
                >
                  {pickerOpen ? "Скрыть список" : "Ещё упражнение"}
                </Button>
                {pickerOpen ? (
                  <ul className="card-surface flex flex-col">
                    {addable.length === 0 ? (
                      <li className="px-5 py-4 text-sm text-muted-foreground">
                        Нечего добавить.
                      </li>
                    ) : (
                      addable.map((exercise) => (
                        <li key={exercise.id}>
                          <button
                            type="button"
                            className="flex w-full items-baseline justify-between gap-3 px-5 py-3 text-left disabled:opacity-50"
                            disabled={busy}
                            onClick={() => void addExercise(exercise.id)}
                          >
                            <span className="text-base">
                              {exercise.short_name || exercise.name}
                            </span>
                            {exercise.current_max ? (
                              <span className="text-sm text-muted-foreground">
                                {formatWeight(exercise.current_max.max_weight)}{" "}
                                кг
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Textarea
                id="session-note"
                value={note}
                disabled={busy || session.status === "skipped"}
                placeholder={isTable ? "Как прошло" : "Как прошло, локоть"}
                onChange={(event) => setNote(event.target.value)}
                onBlur={() => void saveNote()}
                className="min-h-20 text-base"
                aria-label="Заметка"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "completed" && abovePlan ? (
              <Link
                href="/workouts/macro"
                className="text-base leading-snug text-primary"
              >
                Тяжелее плана. Обновить максимум?
              </Link>
            ) : null}

            {session.status === "completed" &&
            session.kind === "gym" &&
            nextName ? (
              <Link
                href="/workouts"
                className="text-base font-medium text-primary"
              >
                Дальше {nextName}
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
                {isTable ? "Убрать стол" : "Убрать"}
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
            disabled={busy || (!isTable && detail.exercises.length === 0)}
            onClick={() => void complete()}
          >
            {isTable ? "Стол был" : "Сделал"}
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
  showActual,
  disabled,
  tone,
  onPick,
}: {
  sets: WorkoutSet[];
  showActual: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  onPick: (ids: string[]) => void;
}) {
  const labels = sets.map((set) => formatSetLine(set, { showActual }));
  const same =
    labels.length > 1 && labels.every((label) => label === labels[0]);

  if (tone === "work" && same) {
    const lead = sets[0];
    const showPlan =
      showActual && lead != null && sets.some((set) => workSetDiffers(set));
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
          {showPlan && lead
            ? ` · план ${formatSetLine(lead, { compact: true })}`
            : ""}
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
            {showActual && workSetDiffers(set) ? (
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                план {formatSetLine(set, { compact: true })}
              </span>
            ) : null}
          </button>
        ))}
      </p>
    </div>
  );
}

function SetEditor({
  set,
  draft,
  disabled,
  groupCount,
  onDraft,
}: {
  set: WorkoutSet;
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
        {setUsesSeconds(set) ? (
          <FieldInput
            label="сек"
            value={draft.seconds}
            disabled={disabled}
            inputMode="decimal"
            onChange={(value) => onDraft({ seconds: value })}
          />
        ) : (
          <FieldInput
            label="раз"
            value={draft.reps}
            disabled={disabled}
            inputMode="numeric"
            onChange={(value) => onDraft({ reps: value })}
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

function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
}
