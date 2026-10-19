"use client";

import { useEffect, useRef } from "react";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  draftChanged,
  draftFromSet,
  formatVisibleSetLine,
  plannedLogPatch,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { SessionSetButtons } from "@/components/workout/session-set-buttons";
import { SessionSetEditor } from "@/components/workout/session-set-editor";
import { SessionSwapSheet } from "@/components/workout/session-swap-sheet";
import { haptic } from "@/lib/telegram/haptic";
import type {
  SessionExerciseDetail,
  SessionTrackInfo,
  WorkoutSet,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/numbers";
import { formatNextLoadHint } from "@/lib/workout/session-load-hint";
import { formatLastTimeWorkLine } from "@/lib/workout/session-memory";
import { droppableWorkSetId } from "@/lib/workout/session-set-add";
import {
  liveSetRecord,
  liveWorkWeight,
  recordTargetLine,
} from "@/lib/workout/set-record";
import { SLOT_INTENSITY_LABELS } from "@/lib/workout/slot-plan";

export function SessionExerciseRow({
  item,
  compact = false,
  openSetIds,
  warmupOpen,
  disabled,
  showActual,
  drafts,
  onOpenSets,
  onToggleWarmup,
  onDraft,
  onRemove,
  onSwap,
  onOfferTemplate,
  templateId = null,
  onToggleSet,
  onLogSet,
  onLogPlan,
  onAddSet,
  onDropSet,
  paired = false,
  pairName = null,
  onPair,
  track = null,
  priorPeak = null,
  priorOn = null,
}: {
  item: SessionExerciseDetail;
  compact?: boolean;
  /** Working kilograms used for this session. */
  track?: SessionTrackInfo | null;
  openSetIds: string[];
  warmupOpen: boolean;
  disabled: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  onOpenSets: (ids: string[]) => void;
  onToggleWarmup: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
  onRemove?: () => void;
  onSwap?: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
  onOfferTemplate?: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
  templateId?: string | null;
  onToggleSet?: (set: WorkoutSet) => void;
  onLogSet?: (set: WorkoutSet, draft: SetDraft) => void;
  onLogPlan?: () => void;
  onAddSet?: () => void;
  onDropSet?: (setId: string) => void;
  paired?: boolean;
  pairName?: string | null;
  onPair?: () => void;
  priorPeak?: number | null;
  priorOn?: string | null;
}) {
  const { density } = useDiaryDensity();
  const diaryCompact = density === "compact";
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const dropSetId = droppableWorkSetId(item.sets);
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;
  const lastTimeLine = item.previous
    ? formatLastTimeWorkLine(item.previous)
    : null;
  const lastWork = work.at(-1) ?? null;
  const timedWork = work.some(
    (set) => set.planned_seconds != null && set.planned_reps == null,
  );
  const loadHint =
    item.previous && !showActual
      ? formatNextLoadHint({
          previous: item.previous,
          step: item.exercise.weight_step,
          reps: lastWork?.planned_reps ?? null,
          repsTo: lastWork?.planned_reps_to ?? null,
          enabled:
            item.load_hint &&
            track == null &&
            item.track_id == null &&
            !timedWork,
        })
      : null;
  const slotLine = [track ? trackInfoLine(track, showActual) : null, item.note]
    .filter(Boolean)
    .join(" · ");
  const focused = openSets.length > 0 || warmupOpen;
  const recordLine = liveSetRecord({
    weight: liveWorkWeight(work, drafts),
    priorPeak,
    priorOn,
  });
  const targetLine =
    focused && !recordLine && work.some((set) => !set.is_completed)
      ? recordTargetLine(priorPeak)
      : null;
  const canLogPlan =
    onLogPlan != null &&
    work.some((set) => !set.is_completed && plannedLogPatch(set) != null);
  const recordReady = useRef(false);

  useEffect(() => {
    if (!recordReady.current) {
      recordReady.current = true;
      return;
    }
    if (recordLine) {
      haptic("success");
    }
  }, [recordLine]);

  function renderEditor(set: WorkoutSet) {
    if (!leadSet || set.id !== leadSet.id) {
      return null;
    }
    const list = set.set_type === "warmup" ? warmup : work;
    const index = list.findIndex((row) => row.id === set.id);
    const previous = index > 0 ? list[index - 1] : null;
    const previousKg = previous
      ? previous.is_completed && previous.actual_weight != null
        ? previous.actual_weight
        : previous.planned_weight
      : null;
    return (
      <SessionSetEditor
        set={set}
        previousKg={set.set_type === "work" ? previousKg : null}
        draft={drafts[set.id] ?? draftFromSet(set)}
        disabled={disabled}
        groupCount={openSets.length}
        weightStep={item.exercise.weight_step}
        onDraft={(patch) => onDraft(set.id, patch)}
        onLog={
          onLogSet &&
          !disabled &&
          (!set.is_completed ||
            draftChanged(set, drafts[set.id] ?? draftFromSet(set)))
            ? (next) => {
                onLogSet(set, next);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div
      className={cn(
        compact ? undefined : "border-b border-border/70 last:border-b-0",
        pairName && "border-l-2 border-primary/40",
      )}
    >
      <div
        className={
          compact
            ? "flex flex-col items-start gap-2.5 px-2 py-3"
            : "flex flex-col items-start gap-2.5 px-5 py-4"
        }
      >
        <div className="flex w-full items-center gap-2">
          <h3
            className={cn(
              "min-w-0 flex-1 font-semibold tracking-tight",
              diaryCompact ? "text-lg" : "text-xl",
            )}
          >
            {item.exercise.short_name || item.exercise.name}
          </h3>
          {item.intensity ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                item.intensity === "heavy"
                  ? "bg-destructive/12 text-destructive"
                  : "bg-primary/12 text-primary",
              )}
            >
              {SLOT_INTENSITY_LABELS[item.intensity].toLowerCase()}
            </span>
          ) : null}
          {onSwap ? (
            <SessionSwapSheet
              sessionId={item.session_id}
              sessionExerciseId={item.id}
              fromExerciseId={item.exercise_id}
              templateId={templateId}
              disabled={disabled}
              onSwap={onSwap}
              onOfferTemplate={onOfferTemplate}
            />
          ) : null}
          {onRemove ? (
            <RemoveRowButton disabled={disabled} onClick={onRemove} />
          ) : null}
        </div>
        {slotLine && (!diaryCompact || focused) ? (
          <p className="-mt-1 text-sm leading-snug text-muted-foreground">
            {slotLine}
          </p>
        ) : null}
        {lastTimeLine && !showActual ? (
          <p className="-mt-1 text-sm leading-snug text-muted-foreground">
            {lastTimeLine}
          </p>
        ) : null}
        {recordLine ? (
          <p className="-mt-1 text-base font-medium text-foreground">
            {recordLine}
          </p>
        ) : null}
        {pairName ? (
          <p className="-mt-1 text-sm leading-snug text-muted-foreground">
            В паре с {pairName}
          </p>
        ) : null}
        {targetLine ? (
          <p className="-mt-1 text-sm leading-snug text-muted-foreground">
            {targetLine}
          </p>
        ) : null}
        {focused && (canLogPlan || onPair) ? (
          <div className="flex flex-wrap gap-2">
            {canLogPlan ? (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-muted/60 px-3 text-base font-medium disabled:opacity-50"
                disabled={disabled}
                onClick={onLogPlan}
              >
                Как по плану
              </button>
            ) : null}
            {onPair ? (
              <button
                type="button"
                className="min-h-11 rounded-lg px-3 text-base font-medium text-muted-foreground disabled:opacity-50"
                disabled={disabled}
                onClick={onPair}
              >
                {paired ? "Убрать пару" : "В пару"}
              </button>
            ) : null}
          </div>
        ) : null}
        {warmup.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1">
            <button
              type="button"
              className="min-h-11 py-2 text-left text-sm leading-snug text-muted-foreground"
              onClick={onToggleWarmup}
            >
              {warmupOpen
                ? "Скрыть разминку"
                : `Разминка ${warmupSummary(warmup, drafts, showActual)}`}
            </button>
            {warmupOpen ? (
              <SessionSetButtons
                sets={warmup}
                drafts={drafts}
                showActual={showActual}
                disabled={disabled}
                tone="warmup"
                openIds={openSetIds}
                onPick={onOpenSets}
                renderAfter={renderEditor}
              />
            ) : null}
          </div>
        ) : null}
        {work.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1.5">
            {loadHint && focused ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {loadHint}
              </p>
            ) : null}
            <SessionSetButtons
              sets={work}
              drafts={drafts}
              showActual={showActual}
              disabled={disabled}
              tone="work"
              openIds={openSetIds}
              onPick={onOpenSets}
              onToggleDone={onToggleSet}
              renderAfter={renderEditor}
            />
            {focused && (onAddSet || (onDropSet && dropSetId)) ? (
              <div className="mt-1 flex w-full flex-wrap gap-2">
                {onAddSet && work.length > 0 ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg px-3 text-base font-medium text-muted-foreground disabled:opacity-50"
                    disabled={disabled}
                    onClick={onAddSet}
                  >
                    + Подход
                  </button>
                ) : null}
                {onDropSet && dropSetId ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg px-3 text-base font-medium text-muted-foreground disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => onDropSet(dropSetId)}
                  >
                    Убрать подход
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function warmupSummary(
  sets: WorkoutSet[],
  drafts: Record<string, SetDraft>,
  showActual: boolean,
): string {
  return sets
    .map((set) =>
      formatVisibleSetLine(set, drafts[set.id], { showActual, compact: true }),
    )
    .join(" · ");
}

function trackInfoLine(track: SessionTrackInfo, done: boolean): string {
  if (track.weight == null) {
    return "";
  }
  const now = `${formatWeight(track.weight)} кг`;
  if (done) {
    return now;
  }
  if (track.next_weight != null) {
    return `${now} · дальше ${formatWeight(track.next_weight)} кг`;
  }
  return `${now} · дальше после недели`;
}
