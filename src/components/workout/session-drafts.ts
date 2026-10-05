import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import type { SessionDetail, WorkoutSet } from "@/lib/types";
import {
  formatSeconds,
  formatWeight,
  parseDecimal,
} from "@/lib/workout/numbers";
import {
  formatSetLine,
  setRirLabel,
  setUsesSeconds,
} from "@/lib/workout/session-format";

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

/** Planned numbers only — for «По плану» while logging a live session. */
export function draftFromPlan(set: WorkoutSet): SetDraft {
  return {
    weight: toDraft(set.planned_weight),
    reps: toDraft(set.planned_reps),
    seconds: toDraft(set.planned_seconds),
    rir: toDraft(set.planned_rir),
  };
}

export function draftMatchesPlan(set: WorkoutSet, draft: SetDraft): boolean {
  const plan = draftFromPlan(set);
  return (
    draft.weight === plan.weight &&
    draft.reps === plan.reps &&
    draft.seconds === plan.seconds &&
    draft.rir === plan.rir
  );
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

/** One tap of − or + on a set. Weight can sit at 0; reps and seconds stay at least 1. */
export function stepDraftValue(
  raw: string,
  direction: -1 | 1,
  step: number,
  kind: "weight" | "reps" | "seconds",
): string {
  const size = step > 0 ? step : kind === "weight" ? 2.5 : 1;
  const current = parseDecimal(raw) ?? 0;
  const min = kind === "weight" ? 0 : 1;
  const next = Math.max(
    min,
    Math.round((current + direction * size) * 10) / 10,
  );
  if (kind === "reps") {
    return String(Math.round(next));
  }
  if (kind === "seconds") {
    return formatSeconds(next);
  }
  return formatWeight(next);
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

/** Weight, reps, or seconds differ. RIR alone keeps the planned range on the line. */
export function draftLoadChanged(set: WorkoutSet, draft: SetDraft): boolean {
  const original = draftFromSet(set);
  return (
    draft.weight !== original.weight ||
    draft.reps !== original.reps ||
    draft.seconds !== original.seconds
  );
}

/**
 * Plan line until the load is edited, then the typed numbers.
 * An open range («5–8») stays until weight, reps, or seconds change.
 */
export function formatVisibleSetLine(
  set: WorkoutSet,
  draft: SetDraft | undefined,
  options: { showActual?: boolean; compact?: boolean } = {},
): string {
  if (!draft || !draftLoadChanged(set, draft)) {
    return formatSetLine(set, options);
  }
  return formatDraftLine(set, draft, Boolean(options.compact));
}

/** Planned reserve stays until the reserve field itself is edited. */
export function visibleSetRirLabel(
  set: WorkoutSet,
  draft: SetDraft | undefined,
  showActual: boolean,
): string | null {
  if (!draft || draft.rir === draftFromSet(set).rir) {
    return setRirLabel(set, showActual);
  }
  const rir = parseRir(draft.rir);
  if (rir == null) {
    return null;
  }
  return rir <= 0 ? "до отказа" : `запас ${rir}`;
}

function formatDraftLine(
  set: WorkoutSet,
  draft: SetDraft,
  compact: boolean,
): string {
  const weight = draftAmount(draft.weight, formatWeight);
  if (setUsesSeconds(set)) {
    const seconds = draftAmount(draft.seconds, formatSeconds);
    return compact ? `${weight}×${seconds}с` : `${weight} × ${seconds} с`;
  }
  const reps = draft.reps.trim() === "" ? "—" : draft.reps.trim();
  return compact ? `${weight}×${reps}` : `${weight} × ${reps}`;
}

function draftAmount(raw: string, format: (value: number) => string): string {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "—";
  }
  const value = parseDecimal(trimmed);
  if (value == null) {
    return trimmed.replace(",", ".");
  }
  return format(value);
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
