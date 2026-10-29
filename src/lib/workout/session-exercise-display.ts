import {
  formatVisibleSetLine,
  plannedLogPatch,
  type SetDraft,
} from "@/components/workout/session-drafts";
import type {
  SessionExerciseDetail,
  SessionTrackInfo,
  WorkoutSet,
} from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";
import { formatNextLoadHint } from "@/lib/workout/session-load-hint";
import { formatLastTimeWorkLine } from "@/lib/workout/session-memory";
import { droppableWorkSetId } from "@/lib/workout/session-set-add";
import {
  liveSetRecord,
  liveWorkWeight,
  recordTargetLine,
} from "@/lib/workout/set-record";

export function trackInfoLine(track: SessionTrackInfo, done: boolean): string {
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

export function warmupSummary(
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

export type SessionExerciseDisplay = {
  warmup: WorkoutSet[];
  work: WorkoutSet[];
  dropSetId: string | null;
  openSets: WorkoutSet[];
  leadSet: WorkoutSet | null;
  lastTimeLine: string | null;
  loadHint: string | null;
  slotLine: string;
  recordLine: string | null;
  targetLine: string | null;
  canLogPlan: boolean;
  focused: boolean;
};

export function buildSessionExerciseDisplay({
  item,
  track,
  openSetIds,
  warmupOpen,
  showActual,
  drafts,
  priorPeak,
  priorOn,
  hasLogPlan,
}: {
  item: SessionExerciseDetail;
  track: SessionTrackInfo | null;
  openSetIds: string[];
  warmupOpen: boolean;
  showActual: boolean;
  drafts: Record<string, SetDraft>;
  priorPeak: number | null;
  priorOn: string | null;
  hasLogPlan: boolean;
}): SessionExerciseDisplay {
  const warmup = item.sets.filter((set) => set.set_type === "warmup");
  const work = item.sets.filter((set) => set.set_type === "work");
  const openSets = item.sets.filter((set) => openSetIds.includes(set.id));
  const leadSet = openSets[0] ?? null;
  const lastWork = work.at(-1) ?? null;
  const timedWork = work.some(
    (set) => set.planned_seconds != null && set.planned_reps == null,
  );
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

  return {
    warmup,
    work,
    dropSetId: droppableWorkSetId(item.sets),
    openSets,
    leadSet,
    lastTimeLine: item.previous ? formatLastTimeWorkLine(item.previous) : null,
    loadHint:
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
        : null,
    slotLine: [track ? trackInfoLine(track, showActual) : null, item.note]
      .filter(Boolean)
      .join(" · "),
    recordLine,
    targetLine,
    canLogPlan:
      hasLogPlan &&
      work.some((set) => !set.is_completed && plannedLogPatch(set) != null),
    focused,
  };
}
