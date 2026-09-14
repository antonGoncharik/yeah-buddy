"use client";

import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  draftFromSet,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { SessionSetButtons } from "@/components/workout/session-set-buttons";
import { SessionSetEditor } from "@/components/workout/session-set-editor";
import type { SessionExerciseDetail, WorkoutSet } from "@/lib/types";
import {
  formatRestClock,
  WORK_REST_SECONDS,
  workSetsNeedRest,
} from "@/lib/workout/rest-timer";
import { formatSetLine } from "@/lib/workout/session-format";
import { formatPreviousWorkLine } from "@/lib/workout/session-memory";

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
  restActive,
  onStartRest,
  restSeconds,
}: {
  item: SessionExerciseDetail;
  compact?: boolean;
  openSetIds: string[];
  warmupOpen: boolean;
  disabled: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  onOpenSets: (ids: string[]) => void;
  onToggleWarmup: () => void;
  onDraft: (setId: string, patch: Partial<SetDraft>) => void;
  onRemove?: () => void;
  restActive?: boolean;
  onStartRest?: () => void;
  restSeconds?: number;
}) {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;
  const previousLine = item.previous
    ? formatPreviousWorkLine(item.previous)
    : null;

  function renderEditor(set: WorkoutSet) {
    if (!leadSet || set.id !== leadSet.id) {
      return null;
    }
    const group = set.set_type === "warmup" ? warmup : work;
    return (
      <SessionSetEditor
        set={set}
        draft={drafts[set.id] ?? draftFromSet(set)}
        disabled={disabled}
        groupCount={openSets.length}
        setNumber={group.findIndex((entry) => entry.id === set.id) + 1}
        onDraft={(patch) => {
          for (const open of openSets) {
            onDraft(open.id, patch);
          }
        }}
      />
    );
  }

  return (
    <div
      className={
        compact ? undefined : "border-b border-border/70 last:border-b-0"
      }
    >
      <div
        className={
          compact
            ? "flex flex-col items-start gap-2.5 px-2 py-3"
            : "flex flex-col items-start gap-2.5 px-5 py-4"
        }
      >
        <div className="flex w-full items-center gap-2">
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
              className="text-left text-sm leading-snug text-muted-foreground"
              onClick={onToggleWarmup}
            >
              {warmupOpen
                ? "Скрыть разминку"
                : `Разминка ${warmupSummary(warmup, showActual)}`}
            </button>
            {warmupOpen ? (
              <SessionSetButtons
                sets={warmup}
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
            {previousLine ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {previousLine}
              </p>
            ) : null}
            <SessionSetButtons
              sets={work}
              showActual={showActual}
              disabled={disabled}
              tone="work"
              openIds={openSetIds}
              onPick={onOpenSets}
              renderAfter={renderEditor}
            />
            {onStartRest && !restActive && workSetsNeedRest(work) ? (
              <button
                type="button"
                className="mt-1 h-11 w-full rounded-lg bg-muted/60 text-base font-medium disabled:opacity-50"
                disabled={disabled}
                onClick={onStartRest}
              >
                Отдых {formatRestClock(restSeconds ?? WORK_REST_SECONDS)}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function warmupSummary(sets: WorkoutSet[], showActual: boolean): string {
  return sets
    .map((set) => formatSetLine(set, { showActual, compact: true }))
    .join(" · ");
}
