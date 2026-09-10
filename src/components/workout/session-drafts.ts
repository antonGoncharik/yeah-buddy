import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export type SetDraft = {
  weight: string;
  reps: string;
  seconds: string;
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
  };
}

export function toDraft(value: number | null): string {
  if (value == null) {
    return "";
  }

  return formatWeight(value);
}

export function parseInteger(raw: string): number | null {
  const value = parseDecimal(raw);
  if (value == null) {
    return null;
  }

  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}
