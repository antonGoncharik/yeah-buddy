"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  draftFromSet,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { haptic, holdTimerStepHaptic } from "@/lib/telegram/haptic";
import type { SessionExerciseDetail, WorkoutSet } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import {
  formatRestClock,
  WORK_REST_SECONDS,
  workSetsNeedRest,
} from "@/lib/workout/rest-timer";
import {
  formatSetLine,
  setUsesSeconds,
  workSetDiffers,
} from "@/lib/workout/session-format";

export function SessionExerciseRow({
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
  restActive,
  onStartRest,
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
  restActive?: boolean;
  onStartRest?: () => void;
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
              <>
                <SetButtons
                  sets={work}
                  showActual={showActual}
                  disabled={disabled}
                  tone="work"
                  onPick={onOpenSets}
                />
                {onStartRest && !restActive && workSetsNeedRest(work) ? (
                  <button
                    type="button"
                    className="mt-1 h-11 w-full rounded-lg bg-muted/60 text-base font-medium disabled:opacity-50"
                    disabled={disabled}
                    onClick={onStartRest}
                  >
                    Отдых {formatRestClock(WORK_REST_SECONDS)}
                  </button>
                ) : null}
              </>
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
    const id = window.setTimeout(() => {
      const next = left - 1;
      const kind = holdTimerStepHaptic(next);
      if (kind) {
        haptic(kind);
      }
      setLeft(next);
    }, 1000);
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
      onClick={() => {
        haptic("tap");
        setLeft(total);
      }}
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
