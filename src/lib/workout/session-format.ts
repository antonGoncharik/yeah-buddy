import type { WorkoutSet } from "@/lib/types";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";

export function setUsesSeconds(set: {
  planned_seconds: number | null;
  actual_seconds?: number | null;
}): boolean {
  return set.planned_seconds != null;
}

export function formatSetLine(
  set: WorkoutSet,
  options: { showActual?: boolean; compact?: boolean } = {},
): string {
  const showActual = Boolean(options.showActual);
  const compact = Boolean(options.compact);
  const weightValue = showActual
    ? (set.actual_weight ?? set.planned_weight)
    : set.planned_weight;
  const weight = weightValue == null ? "—" : formatWeight(weightValue);
  if (setUsesSeconds(set)) {
    const secondsValue = showActual
      ? (set.actual_seconds ?? set.planned_seconds)
      : set.planned_seconds;
    const secondsLabel =
      secondsValue == null ? "—" : formatSeconds(secondsValue);
    return compact
      ? `${weight}×${secondsLabel}с`
      : `${weight} × ${secondsLabel} с`;
  }

  const reps = showActual
    ? (set.actual_reps ?? set.planned_reps)
    : set.planned_reps;
  const repsLabel = reps ?? "—";
  return compact ? `${weight}×${repsLabel}` : `${weight} × ${repsLabel}`;
}

export function firstWorkSet(sets: WorkoutSet[]): WorkoutSet | null {
  return sets.find((set) => set.set_type === "work") ?? null;
}

export function workSetDiffers(set: WorkoutSet): boolean {
  if (set.set_type !== "work") {
    return false;
  }

  if (
    set.actual_weight != null &&
    set.planned_weight != null &&
    set.actual_weight !== set.planned_weight
  ) {
    return true;
  }

  if (
    set.actual_reps != null &&
    set.planned_reps != null &&
    set.actual_reps !== set.planned_reps
  ) {
    return true;
  }

  if (
    set.actual_seconds != null &&
    set.planned_seconds != null &&
    set.actual_seconds !== set.planned_seconds
  ) {
    return true;
  }

  return false;
}

export function workAbovePlan(set: WorkoutSet): boolean {
  return (
    set.set_type === "work" &&
    set.actual_weight != null &&
    set.planned_weight != null &&
    set.actual_weight > set.planned_weight
  );
}

export function formatWorkSummary(
  exercises: Array<{ name: string; sets: WorkoutSet[] }>,
  limit = 3,
): string | null {
  const parts: string[] = [];
  let workCount = 0;
  for (const item of exercises) {
    const work = firstWorkSet(item.sets);
    if (!work) {
      continue;
    }
    workCount += 1;
    if (parts.length < limit) {
      parts.push(
        `${item.name} ${formatSetLine(work, { showActual: true, compact: true })}`,
      );
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return workCount > limit ? `${parts.join(" · ")}…` : parts.join(" · ");
}
