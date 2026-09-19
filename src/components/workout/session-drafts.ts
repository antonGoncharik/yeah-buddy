import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export type SetDraft = {
  weight: string;
  reps: string;
  seconds: string;
  /** Reps in reserve; empty when not logged. */
  rir: string;
};

export function formatSessionDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMMM", { locale: ru });
  } catch {
    return isoDate;
  }
}

export function draftsFromDetail(
  detail: SessionDetail,
): Record<string, SetDraft> {
  const next: Record<string, SetDraft> = {};
  for (const item of detail.exercises) {
    for (const set of item.sets) {
      next[set.id] = draftFromSet(set);
    }
  }

  return next;
}

export function draftFromSet(set: WorkoutSet): SetDraft {
  return {
    weight: toDraft(set.actual_weight ?? set.planned_weight),
    reps: toDraft(set.actual_reps ?? set.planned_reps),
    seconds: toDraft(set.actual_seconds ?? set.planned_seconds),
    rir: toDraft(set.actual_rir),
  };
}

/** RIR is a small whole number; anything else means «not logged». */
export function parseRir(raw: string): number | null {
  const value = parseDecimal(raw);
  if (value == null) {
    return null;
  }
  const rounded = Math.round(value);
  return rounded >= 0 && rounded <= 10 ? rounded : null;
}

export function toDraft(value: number | null): string {
  if (value == null) {
    return "";
  }

  return formatWeight(value);
}

export function draftChanged(set: WorkoutSet, draft: SetDraft): boolean {
  const original = draftFromSet(set);
  return (
    draft.weight !== original.weight ||
    draft.reps !== original.reps ||
    draft.seconds !== original.seconds ||
    draft.rir !== original.rir
  );
}

export function completeSetOverrides(
  detail: SessionDetail,
  drafts: Record<string, SetDraft>,
): Array<{
  id: string;
  actual_weight: number | null;
  actual_reps: number | null;
  actual_seconds: number | null;
  actual_rir: number | null;
}> {
  const kind = detail.session.workout_type;
  const sets: Array<{
    id: string;
    actual_weight: number | null;
    actual_reps: number | null;
    actual_seconds: number | null;
    actual_rir: number | null;
  }> = [];

  for (const item of detail.exercises) {
    for (const set of item.sets) {
      const draft = drafts[set.id];
      if (!draft || !draftChanged(set, draft)) {
        continue;
      }
      sets.push({
        id: set.id,
        actual_weight: parseDecimal(draft.weight),
        actual_reps: kind === "dynamic" ? parseInteger(draft.reps) : null,
        actual_seconds: kind === "static" ? parseDecimal(draft.seconds) : null,
        actual_rir: parseRir(draft.rir),
      });
    }
  }

  return sets;
}

export function parseInteger(raw: string): number | null {
  const value = parseDecimal(raw);
  if (value == null) {
    return null;
  }

  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}
