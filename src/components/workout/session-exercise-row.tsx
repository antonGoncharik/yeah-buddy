"use client";

import { useEffect, useMemo, useRef } from "react";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import type { SetDraft } from "@/components/workout/session-drafts";
import { SessionExerciseRowHeader } from "@/components/workout/session-exercise-row-header";
import { SessionExerciseRowMeta } from "@/components/workout/session-exercise-row-meta";
import { SessionExerciseSetSections } from "@/components/workout/session-exercise-set-sections";
import { haptic } from "@/lib/telegram/haptic";
import type {
  SessionExerciseDetail,
  SessionTrackInfo,
  WorkoutSet,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildSessionExerciseDisplay } from "@/lib/workout/session-exercise-display";

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
  const display = useMemo(
    () =>
      buildSessionExerciseDisplay({
        item,
        track: track ?? null,
        openSetIds,
        warmupOpen,
        showActual,
        drafts,
        priorPeak: priorPeak ?? null,
        priorOn: priorOn ?? null,
        hasLogPlan: onLogPlan != null,
      }),
    [
      drafts,
      item,
      onLogPlan,
      openSetIds,
      priorOn,
      priorPeak,
      showActual,
      track,
      warmupOpen,
    ],
  );
  const recordReady = useRef(false);

  useEffect(() => {
    if (!recordReady.current) {
      recordReady.current = true;
      return;
    }
    if (display.recordLine) {
      haptic("success");
    }
  }, [display.recordLine]);

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
            ? diaryCompact
              ? "flex flex-col items-start gap-1 px-2 py-1.5"
              : "flex flex-col items-start gap-2.5 px-2 py-3"
            : "flex flex-col items-start gap-2.5 px-5 py-4"
        }
      >
        <SessionExerciseRowHeader
          item={item}
          diaryCompact={diaryCompact}
          disabled={disabled}
          templateId={templateId}
          onSwap={onSwap}
          onOfferTemplate={onOfferTemplate}
          onRemove={onRemove}
        />
        <SessionExerciseRowMeta
          diaryCompact={diaryCompact}
          focused={display.focused}
          showActual={showActual}
          slotLine={display.slotLine}
          lastTimeLine={display.lastTimeLine}
          recordLine={display.recordLine}
          pairName={pairName}
          targetLine={display.targetLine}
        />
        {display.focused && (display.canLogPlan || onPair) ? (
          <div className="flex flex-wrap gap-2">
            {display.canLogPlan && onLogPlan ? (
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
        <SessionExerciseSetSections
          item={item}
          display={display}
          openSetIds={openSetIds}
          warmupOpen={warmupOpen}
          showActual={showActual}
          drafts={drafts}
          disabled={disabled}
          loadHint={display.loadHint}
          onOpenSets={onOpenSets}
          onToggleWarmup={onToggleWarmup}
          onDraft={onDraft}
          onToggleSet={onToggleSet}
          onLogSet={onLogSet}
          onAddSet={onAddSet}
          onDropSet={onDropSet}
        />
      </div>
    </div>
  );
}
