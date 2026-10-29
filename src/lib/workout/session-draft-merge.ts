import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { draftChanged, type SetDraft } from "@/lib/workout/session-set-drafts";

function setStamp(set: WorkoutSet): string {
  return [
    set.is_completed ? 1 : 0,
    set.planned_weight,
    set.planned_reps,
    set.planned_reps_to,
    set.planned_seconds,
    set.planned_rir,
    set.actual_weight,
    set.actual_reps,
    set.actual_seconds,
    set.actual_rir,
  ].join(":");
}

/** Keep an unsaved edit on screen when a refresh did not change that set. */
export function mergeLiveDrafts(
  previous: SessionDetail | null,
  next: SessionDetail,
  base: Record<string, SetDraft>,
  live: Record<string, SetDraft>,
): Record<string, SetDraft> {
  if (!previous || previous.session.id !== next.session.id) {
    return base;
  }

  const before = new Map<string, WorkoutSet>();
  for (const item of previous.exercises) {
    for (const set of item.sets) {
      before.set(set.id, set);
    }
  }

  for (const item of next.exercises) {
    for (const set of item.sets) {
      const prior = before.get(set.id);
      const draft = live[set.id];
      if (!prior || !draft || setStamp(prior) !== setStamp(set)) {
        continue;
      }
      if (draftChanged(set, draft)) {
        base[set.id] = draft;
      }
    }
  }

  return base;
}
