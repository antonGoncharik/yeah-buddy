"use client";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  draftFromSet,
  formatVisibleSetLine,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { SessionSetButtons } from "@/components/workout/session-set-buttons";
import { SessionSetEditor } from "@/components/workout/session-set-editor";
import type {
  SessionExerciseDetail,
  SessionTrackInfo,
  WorkoutSet,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/numbers";
import {
  formatRestClock,
  WORK_REST_SECONDS,
  workSetsNeedRest,
} from "@/lib/workout/rest-timer";
import { formatNextLoadHint } from "@/lib/workout/session-load-hint";
import { formatPreviousWorkLine } from "@/lib/workout/session-memory";
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
  restActive,
  onStartRest,
  restSeconds,
  track = null,
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
  restActive?: boolean;
  onStartRest?: () => void;
  restSeconds?: number;
}) {
  const { density } = useDiaryDensity();
  const diaryCompact = density === "compact";
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;
  const previousLine = item.previous
    ? formatPreviousWorkLine(item.previous)
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

  function renderEditor(set: WorkoutSet) {
    if (!leadSet || set.id !== leadSet.id) {
      return null;
    }
    return (
      <SessionSetEditor
        set={set}
        draft={drafts[set.id] ?? draftFromSet(set)}
        disabled={disabled}
        groupCount={openSets.length}
        weightStep={item.exercise.weight_step}
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
          {onRemove ? (
            <RemoveRowButton disabled={disabled} onClick={onRemove} />
          ) : null}
        </div>
        {slotLine && (!diaryCompact || focused) ? (
          <p className="-mt-1 text-sm leading-snug text-muted-foreground">
            {slotLine}
          </p>
        ) : null}
        {warmup.length > 0 ? (
          <div className="flex w-full flex-col items-start gap-1">
            <button
              type="button"
              className="text-left text-sm leading-snug text-muted-foreground"
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
            {previousLine && focused ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {previousLine}
              </p>
            ) : null}
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
