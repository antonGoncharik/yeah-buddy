"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Textarea } from "@/components/ui/textarea";
import { cachedGet, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError, SESSION_PLAN_EMPTY } from "@/lib/messages";
import { gymQuote } from "@/lib/quotes";
import type {
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSet,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import { phaseEndHint, readPhaseCircle } from "@/lib/workout/hints";
import { PHASE_TYPE_LABELS, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  formatSetLine,
  setUsesSeconds,
  workAbovePlan,
  workSetDiffers,
} from "@/lib/workout/session-format";
import { readSessionDetail } from "@/lib/workout/session-payload";

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
  const [workOpen, setWorkOpen] = useState<Record<string, boolean>>({});
  const [nextName, setNextName] = useState<string | null>(null);
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [note, setNote] = useState("");
  const [correcting, setCorrecting] = useState(false);

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
          const next = readSessionDetail(data);
          if (!next) {
            return false;
          }
          applyDetail(next);
          if (next.session.status === "completed") {
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

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
        setCorrecting(false);
        await loadFollowUp(next.session.session_date);
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

  async function removeExercise(sessionExerciseId: string) {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message: "Убрать упражнение из тренировки?",
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
      const response = await fetch(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
        { method: "DELETE" },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
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

    const ok = await confirm({
      message: "Убрать эту тренировку? Очередь останется.",
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
  const showStickyComplete =
    session?.status === "planned" ||
    (session?.status === "completed" && correcting);
  const canEditSets =
    session?.status === "planned" ||
    (session?.status === "completed" && correcting);

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
        {loading ? <ScreenLoading /> : null}

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
              <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
                <p className="text-lg font-medium">Нет упражнений в плане</p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {SESSION_PLAN_EMPTY}
                </p>
                {session.status === "planned" ? (
                  <Link
                    href="/workouts/exercises"
                    className={cn(buttonVariants(), "h-14 text-lg")}
                  >
                    Написать максимумы
                  </Link>
                ) : null}
              </section>
            ) : (
              <section className="card-surface animate-rise overflow-hidden">
                {session.status === "planned" ? (
                  <p className="border-b border-border/70 px-5 py-3 text-sm text-muted-foreground">
                    Не так вышло — нажми подход. В конце «Готово».
                  </p>
                ) : null}
                {detail.exercises.map((item) => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    openSetIds={openSetIds}
                    warmupOpen={warmupOpen[item.id] !== false}
                    workOpen={workOpen[item.id] !== false}
                    disabled={busy || !canEditSets}
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
                        [item.id]: current[item.id] === false,
                      }))
                    }
                    onToggleWork={() =>
                      setWorkOpen((current) => ({
                        ...current,
                        [item.id]: current[item.id] === false,
                      }))
                    }
                    onDraft={(setId, patch) =>
                      setDrafts((current) => ({
                        ...current,
                        [setId]: { ...current[setId], ...patch },
                      }))
                    }
                    onRemove={
                      session.status === "planned"
                        ? () => void removeExercise(item.id)
                        : undefined
                    }
                  />
                ))}
              </section>
            )}

            {session.status === "planned" ||
            (session.status === "completed" && correcting) ||
            note.trim() !== "" ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  id="session-note"
                  value={note}
                  disabled={busy || !canEditSets}
                  placeholder="Как прошло"
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => {
                    if (canEditSets) {
                      void saveNote();
                    }
                  }}
                  className="min-h-20 text-base"
                  aria-label="Заметка"
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "completed" && !correcting ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-5">
                <h2 className="text-xl font-semibold">Готово</h2>
                <p className="text-sm text-muted-foreground">
                  {gymQuote(session.id)}
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Записано. Если вспомнил другой вес — поправь, тренировка
                  останется сделанной.
                </p>
                {abovePlan ? (
                  <p className="text-base leading-relaxed">
                    Где-то взял больше плана. Рабочий вес сам не вырастет — это
                    в макроцикле.
                  </p>
                ) : null}
                {nextName ? (
                  <p className="text-base text-muted-foreground">
                    В очереди дальше: {nextName}.
                  </p>
                ) : null}
                {phaseHint ? (
                  <p className="text-base text-muted-foreground">{phaseHint}</p>
                ) : null}
                {abovePlan ? (
                  <Link
                    href="/workouts/macro"
                    className="text-base font-medium text-primary"
                  >
                    Посмотреть максимумы
                  </Link>
                ) : null}
                {phaseHint && !abovePlan ? (
                  <Link
                    href="/workouts/macro"
                    className="text-base font-medium text-primary"
                  >
                    К макроциклу
                  </Link>
                ) : null}
                {nextName ? (
                  <Link
                    href="/workouts"
                    className="text-base font-medium text-primary"
                  >
                    К очереди
                  </Link>
                ) : (
                  <Link
                    href="/workouts"
                    className="text-base font-medium text-primary"
                  >
                    К тренировкам
                  </Link>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 text-base"
                  disabled={busy}
                  onClick={() => setCorrecting(true)}
                >
                  Поправить записанное
                </Button>
              </section>
            ) : null}

            {session.status === "completed" && correcting ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Поправь подходы и сохрани. Тренировка уже сделана.
              </p>
            ) : null}

            {session.status === "planned" || session.status === "skipped" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void cancelToday()}
              >
                Не получилось
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <StickyActions>
          <Button
            type="button"
            className="h-14 w-full text-lg"
            disabled={busy || detail.exercises.length === 0}
            onClick={() => void complete()}
          >
            {session.status === "planned" ? "Готово" : "Сохранить"}
          </Button>
        </StickyActions>
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
  workOpen,
  disabled,
  showActual,
  drafts,
  onOpenSets,
  onToggleWarmup,
  onToggleWork,
  onDraft,
  onRemove,
}: {
  item: SessionExerciseDetail;
  openSetIds: string[];
  warmupOpen: boolean;
  workOpen: boolean;
  disabled: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  onOpenSets: (ids: string[]) => void;
  onToggleWarmup: () => void;
  onToggleWork: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
  onRemove?: () => void;
}) {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;
  const leadGroup =
    leadSet?.set_type === "warmup"
      ? warmup
      : leadSet?.set_type === "work"
        ? work
        : [];
  const leadNumber = leadSet
    ? leadGroup.findIndex((set) => set.id === leadSet.id) + 1
    : 0;
  const editorOpen =
    leadSet != null && (leadSet.set_type === "warmup" ? warmupOpen : workOpen);

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <div className="flex flex-col items-start gap-2.5 px-5 py-4">
        <div className="flex w-full items-start gap-2">
          <h3 className="min-w-0 flex-1 text-xl font-semibold tracking-tight">
            {item.exercise.short_name || item.exercise.name}
          </h3>
          {onRemove ? (
            <RemoveRowButton disabled={disabled} onClick={onRemove} />
          ) : null}
        </div>
        {warmup.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1">
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={onToggleWarmup}
            >
              {warmupOpen
                ? "Скрыть разминку"
                : `Разминка · ${warmup.length} ${setCountWord(warmup.length)}`}
            </button>
            {warmupOpen ? (
              <SetButtons
                sets={warmup}
                showActual={showActual}
                disabled={disabled}
                tone="warmup"
                onPick={onOpenSets}
              />
            ) : null}
          </div>
        ) : null}
        {work.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1">
            <button
              type="button"
              className="text-sm text-muted-foreground"
              onClick={onToggleWork}
            >
              {workOpen
                ? "Скрыть рабочие"
                : `Рабочие · ${work.length} ${setCountWord(work.length)}`}
            </button>
            {workOpen ? (
              <SetButtons
                sets={work}
                showActual={showActual}
                disabled={disabled}
                tone="work"
                onPick={onOpenSets}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {editorOpen && leadSet ? (
        <SetEditor
          set={leadSet}
          draft={drafts[leadSet.id] ?? draftFromSet(leadSet)}
          disabled={disabled}
          groupCount={openSets.length}
          setNumber={leadNumber}
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

  return (
    <div className="flex w-full flex-col gap-1">
      <ol className="flex flex-col gap-1.5">
        {sets.map((set, index) => (
          <li key={set.id}>
            <button
              type="button"
              className="flex w-full items-baseline gap-2.5 text-left disabled:opacity-60"
              disabled={disabled}
              onClick={() => onPick([set.id])}
            >
              <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span
                className={
                  tone === "work"
                    ? "text-2xl font-semibold tracking-tight tabular-nums"
                    : "text-base tabular-nums text-muted-foreground"
                }
              >
                {labels[index]}
              </span>
            </button>
            {showActual && workSetDiffers(set) ? (
              <p className="mt-0.5 pl-7 text-sm text-muted-foreground">
                план {formatSetLine(set, { compact: true })}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SetEditor({
  set,
  draft,
  disabled,
  groupCount,
  setNumber,
  onDraft,
}: {
  set: WorkoutSet;
  draft: SetDraft;
  disabled: boolean;
  groupCount: number;
  setNumber: number;
  onDraft: (patch: Partial<SetDraft>) => void;
}) {
  const kind = set.set_type === "warmup" ? "Разминка" : "Рабочий";
  const title =
    groupCount > 1
      ? `${kind} · ${groupCount} ${setCountWord(groupCount)}`
      : `${kind} ${setNumber}`;

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
          <>
            <FieldInput
              label="сек"
              value={draft.seconds}
              disabled={disabled}
              inputMode="decimal"
              onChange={(value) => onDraft({ seconds: value })}
            />
            <HoldTimer
              seconds={parseDecimal(draft.seconds)}
              disabled={disabled}
            />
          </>
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

function HoldTimer({
  seconds,
  disabled,
}: {
  seconds: number | null;
  disabled: boolean;
}) {
  const [left, setLeft] = useState<number | null>(null);
  const total = seconds != null && seconds > 0 ? Math.round(seconds) : 0;

  useEffect(() => {
    if (left == null || left <= 0) {
      return;
    }
    const id = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  if (total <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="col-span-2 h-11 rounded-lg bg-background text-base font-medium disabled:opacity-50"
      disabled={disabled}
      onClick={() => setLeft(total)}
    >
      {left == null
        ? `Засечь ${total} с`
        : left === 0
          ? "Ещё раз"
          : `${left} с`}
    </button>
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
