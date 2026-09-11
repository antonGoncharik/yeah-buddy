"use client";

import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  draftFromSet,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { SessionSetButtons } from "@/components/workout/session-set-buttons";
import {
  SessionSetEditor,
  setCountWord,
} from "@/components/workout/session-set-editor";
import type { SessionExerciseDetail } from "@/lib/types";
import {
  formatRestClock,
  WORK_REST_SECONDS,
  workSetsNeedRest,
} from "@/lib/workout/rest-timer";
import { formatPreviousWorkLine } from "@/lib/workout/session-memory";

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
  restSeconds,
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
  restSeconds?: number;
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
  const previousLine = item.previous
    ? formatPreviousWorkLine(item.previous)
    : null;

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
              <SessionSetButtons
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
            {previousLine ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {previousLine}
              </p>
            ) : null}
            {workOpen ? (
              <>
                <SessionSetButtons
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
                    Отдых {formatRestClock(restSeconds ?? WORK_REST_SECONDS)}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {editorOpen && leadSet ? (
        <SessionSetEditor
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
