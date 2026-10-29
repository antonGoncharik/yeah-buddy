"use client";

import { SessionSetButtons } from "@/components/workout/session-set-buttons";
import { SessionSetEditor } from "@/components/workout/session-set-editor";
import type { SessionExerciseDetail, WorkoutSet } from "@/lib/types";
import { warmupSummary } from "@/lib/workout/session-exercise-display";
import {
  draftChanged,
  draftFromSet,
  type SetDraft,
} from "@/lib/workout/session-set-drafts";

export function SessionExerciseSetSections({
  item,
  display,
  openSetIds,
  warmupOpen,
  showActual,
  drafts,
  disabled,
  loadHint,
  onOpenSets,
  onToggleWarmup,
  onDraft,
  onToggleSet,
  onLogSet,
  onAddSet,
  onDropSet,
}: {
  item: SessionExerciseDetail;
  display: {
    warmup: WorkoutSet[];
    work: WorkoutSet[];
    dropSetId: string | null;
    leadSet: WorkoutSet | null;
    openSets: WorkoutSet[];
    focused: boolean;
  };
  openSetIds: string[];
  warmupOpen: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  disabled: boolean;
  loadHint: string | null;
  onOpenSets: (ids: string[]) => void;
  onToggleWarmup: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
  onToggleSet?: (set: WorkoutSet) => void;
  onLogSet?: (set: WorkoutSet, draft: SetDraft) => void;
  onAddSet?: () => void;
  onDropSet?: (setId: string) => void;
}) {
  const { warmup, work, dropSetId, leadSet, openSets, focused } = display;

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
    <>
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
    </>
  );
}
