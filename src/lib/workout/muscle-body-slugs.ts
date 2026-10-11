import type {
  MuscleBodyView,
  MuscleCell,
  MuscleId,
  VolumeBand,
} from "@/lib/types";

/** SVG slug → muscle ids (react-native-body-highlighter). */
export const SLUG_TO_MUSCLES: Record<string, MuscleId[]> = {
  chest: ["chest"],
  obliques: ["obliques"],
  abs: ["abs"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearm: ["forearms"],
  quadriceps: ["quads"],
  adductors: ["adductors"],
  calves: ["calves"],
  tibialis: ["calves"],
  trapezius: ["traps"],
  deltoid_anterior: ["front_delts"],
  deltoid_lateral: ["side_delts"],
  deltoid_posterior_l: ["rear_delts"],
  deltoid_posterior_r: ["side_delts", "rear_delts"],
  "upper-back": ["upper_back", "lats"],
  "lower-back": ["lower_back"],
  gluteal: ["glutes"],
  hamstring: ["hamstrings"],
};

export const BODY_SLUGS_BY_VIEW: Record<MuscleBodyView, string[]> = {
  front: [
    "chest",
    "deltoid_anterior",
    "deltoid_lateral",
    "trapezius",
    "biceps",
    "triceps",
    "forearm",
    "abs",
    "obliques",
    "quadriceps",
    "adductors",
    "calves",
    "tibialis",
  ],
  back: [
    "trapezius",
    "deltoid_posterior_l",
    "deltoid_posterior_r",
    "upper-back",
    "triceps",
    "lower-back",
    "forearm",
    "gluteal",
    "hamstring",
    "adductors",
    "calves",
  ],
};

export function slugVolumeBand(
  slug: string,
  byId: Map<MuscleId, MuscleCell>,
): VolumeBand {
  const ids = SLUG_TO_MUSCLES[slug] ?? [];
  let max = 0 as VolumeBand;
  for (const id of ids) {
    const cell = byId.get(id);
    if (cell && cell.volume_band > max) {
      max = cell.volume_band;
    }
  }
  return max;
}

export function slugDaysSince(
  slug: string,
  byId: Map<MuscleId, MuscleCell>,
): number | null {
  const ids = SLUG_TO_MUSCLES[slug] ?? [];
  let min: number | null = null;
  for (const id of ids) {
    const cell = byId.get(id);
    if (cell?.days_since == null) {
      continue;
    }
    if (min == null || cell.days_since < min) {
      min = cell.days_since;
    }
  }
  return min;
}

export function slugPrimaryMuscle(slug: string): MuscleId | null {
  const ids = SLUG_TO_MUSCLES[slug];
  return ids?.[0] ?? null;
}

export function slugSelectMuscle(
  slug: string,
  byId: Map<MuscleId, MuscleCell>,
): MuscleId | null {
  const ids = SLUG_TO_MUSCLES[slug] ?? [];
  let pick: MuscleCell | null = null;
  for (const id of ids) {
    const cell = byId.get(id);
    if (!cell) {
      continue;
    }
    if (
      !pick ||
      cell.volume_band > pick.volume_band ||
      (cell.volume_band === pick.volume_band && cell.sets > pick.sets)
    ) {
      pick = cell;
    }
  }
  return pick?.id ?? slugPrimaryMuscle(slug);
}
