import type { SessionFeel, SessionPreviousWork, WorkoutSet } from "@/lib/types";
import { SESSION_FEEL_LABELS } from "@/lib/workout/labels";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";
import { setUsesSeconds } from "@/lib/workout/session-format";

export function previousWorkFromSets(
  sets: WorkoutSet[],
  feel: SessionFeel | null,
): SessionPreviousWork | null {
  const work = anchorWorkSet(sets);
  if (!work) {
    return null;
  }

  const weight = work.actual_weight ?? work.planned_weight;
  const reps = work.actual_reps ?? work.planned_reps;
  const seconds = work.actual_seconds ?? work.planned_seconds;
  const timed = setUsesSeconds(work);
  const hasSet =
    weight != null &&
    weight > 0 &&
    (timed ? seconds != null && seconds > 0 : reps != null && reps > 0);
  if (!hasSet && feel == null) {
    return null;
  }

  const rir = work.actual_rir;
  return {
    weight: hasSet ? weight : null,
    reps: hasSet && !timed ? reps : null,
    seconds: hasSet && timed ? seconds : null,
    rir: hasSet && !timed && rir != null && rir >= 0 ? rir : null,
    feel,
    same_phase: true,
    hold: false,
  };
}

/** Last work set that was actually loaded. RIR lives on that set. */
function anchorWorkSet(sets: WorkoutSet[]): WorkoutSet | null {
  const work = sets.filter((set) => set.set_type === "work");
  for (let index = work.length - 1; index >= 0; index -= 1) {
    const set = work[index];
    if (set && workSetHasLoad(set)) {
      return set;
    }
  }
  return work.at(-1) ?? null;
}

function workSetHasLoad(set: WorkoutSet): boolean {
  const weight = set.actual_weight ?? set.planned_weight;
  if (weight == null || weight <= 0) {
    return false;
  }
  if (setUsesSeconds(set)) {
    const seconds = set.actual_seconds ?? set.planned_seconds;
    return seconds != null && seconds > 0;
  }
  const reps = set.actual_reps ?? set.planned_reps;
  return reps != null && reps > 0;
}

export function formatPreviousWorkLine(
  previous: SessionPreviousWork,
): string | null {
  const setPart = formatPreviousSet(previous);
  const feelPart = previous.feel
    ? `было ${SESSION_FEEL_LABELS[previous.feel].toLowerCase()}`
    : null;
  if (!setPart && !feelPart) {
    return null;
  }
  if (!setPart) {
    return `прошлый: ${feelPart}`;
  }
  if (!feelPart) {
    return `прошлый: ${setPart}`;
  }
  return `прошлый: ${setPart}, ${feelPart}`;
}

export function shouldHoldWeights(feels: Array<SessionFeel | null>): boolean {
  const lastTwo = feels.slice(-2);
  return lastTwo.length >= 2 && lastTwo.every((feel) => feel === "miss");
}

function formatPreviousSet(previous: SessionPreviousWork): string | null {
  if (previous.weight == null || previous.weight <= 0) {
    return null;
  }

  const weight = formatWeight(previous.weight);
  if (previous.seconds != null && previous.seconds > 0) {
    return `${weight}×${formatSeconds(previous.seconds)}с`;
  }
  if (previous.reps != null && previous.reps > 0) {
    return `${weight}×${previous.reps}`;
  }
  return null;
}
