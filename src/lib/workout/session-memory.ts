import type { SessionFeel, SessionPreviousWork, WorkoutSet } from "@/lib/types";
import { SESSION_FEEL_LABELS } from "@/lib/workout/labels";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";
import { firstWorkSet, setUsesSeconds } from "@/lib/workout/session-format";

export function previousWorkFromSets(
  sets: WorkoutSet[],
  feel: SessionFeel | null,
): SessionPreviousWork | null {
  const work = firstWorkSet(sets);
  if (!work) {
    return null;
  }

  const weight = work.actual_weight ?? work.planned_weight;
  const reps = work.actual_reps ?? work.planned_reps;
  const seconds = work.actual_seconds ?? work.planned_seconds;
  const hasSet =
    weight != null &&
    weight > 0 &&
    (setUsesSeconds(work)
      ? seconds != null && seconds > 0
      : reps != null && reps > 0);
  if (!hasSet && feel == null) {
    return null;
  }

  return {
    weight: hasSet ? weight : null,
    reps: hasSet && !setUsesSeconds(work) ? reps : null,
    seconds: hasSet && setUsesSeconds(work) ? seconds : null,
    feel,
  };
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
