import type { SessionDetail } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import type { CompleteSessionInput } from "@/lib/workout/session-schema";
import { setUsesSeconds } from "@/lib/workout/session-format";
import { completedSetWeight } from "@/lib/workout/set-log";

type SetOverride = NonNullable<CompleteSessionInput["sets"]>[number];

export function shouldSkipSetOnComplete(
  set: SessionDetail["exercises"][number]["sets"][number],
  override: SetOverride | undefined,
): boolean {
  if (set.set_type !== "work") {
    return false;
  }
  const touched =
    set.is_completed || set.logged || override !== undefined;
  if (touched) {
    return false;
  }
  return set.planned_weight == null || !(set.planned_weight > 0);
}

export function resolveSetActuals(
  set: SessionDetail["exercises"][number]["sets"][number],
  override: SetOverride | undefined,
): {
  actual_weight: number | null;
  actual_reps: number | null;
  actual_seconds: number | null;
  actual_rir: number | null;
} {
  return {
    actual_weight:
      override?.actual_weight !== undefined
        ? override.actual_weight
        : (set.actual_weight ?? set.planned_weight),
    actual_reps:
      override?.actual_reps !== undefined
        ? override.actual_reps
        : (set.actual_reps ?? set.planned_reps),
    actual_seconds:
      override?.actual_seconds !== undefined
        ? override.actual_seconds
        : (set.actual_seconds ?? set.planned_seconds),
    actual_rir:
      override?.actual_rir !== undefined ? override.actual_rir : set.actual_rir,
  };
}

export function validateSessionBeforeComplete(
  detail: SessionDetail,
  input: CompleteSessionInput = {},
): void {
  const overrides = new Map(
    (input.sets ?? []).map((set) => [set.id, set] as const),
  );

  for (const item of detail.exercises) {
    const name = exerciseShortLabel(
      item.exercise.short_name,
      item.exercise.name,
    );
    for (const set of item.sets) {
      const override = overrides.get(set.id);
      if (shouldSkipSetOnComplete(set, override)) {
        continue;
      }

      const actuals = resolveSetActuals(set, override);
      const typedWeight =
        override?.actual_weight !== undefined
          ? override.actual_weight
          : set.actual_weight;

      const weight = completedSetWeight({
        plannedWeight: set.planned_weight,
        typedWeight,
      });
      if (weight === "missing") {
        throw new Error(
          `«${name}», подход ${set.set_number}: напиши фактический вес.`,
        );
      }

      if (set.set_type !== "work") {
        continue;
      }

      const timed = setUsesSeconds(set);
      if (timed) {
        const seconds = actuals.actual_seconds;
        if (seconds == null || !(seconds > 0)) {
          throw new Error(
            `«${name}», подход ${set.set_number}: напиши секунды.`,
          );
        }
        continue;
      }

      const reps = actuals.actual_reps;
      if (reps == null || !(reps > 0)) {
        if (weight != null && weight > 0) {
          throw new Error(
            `«${name}», подход ${set.set_number}: напиши повторы.`,
          );
        }
      }
    }
  }
}
