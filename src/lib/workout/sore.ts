import { shiftIsoDate } from "@/lib/day/dates";
import type { MuscleId } from "@/lib/types";
import { floorToStep } from "@/lib/workout/formulas";

export const SORE_SPOTS = [
  {
    id: "shoulder",
    label: "Плечо",
    muscles: ["front_delts", "side_delts", "chest"],
  },
  {
    id: "elbow",
    label: "Локоть",
    muscles: ["biceps", "triceps", "forearms"],
  },
  {
    id: "knee",
    label: "Колено",
    muscles: ["quads"],
  },
  {
    id: "back",
    label: "Поясница",
    muscles: ["lower_back", "hamstrings"],
  },
] as const;

export type SoreSpotId = (typeof SORE_SPOTS)[number]["id"];

export interface SoreMark {
  id: SoreSpotId;
  until: string;
  easedSessionIds: string[];
}

export function soreUntil(today: string): string {
  return shiftIsoDate(today, 6);
}

export function activeSoreMarks(
  marks: readonly SoreMark[],
  today: string,
): SoreMark[] {
  return marks.filter((mark) => mark.until >= today);
}

export function soreMuscles(marks: readonly SoreMark[]): MuscleId[] {
  const ids = new Set<MuscleId>();
  for (const mark of marks) {
    const spot = SORE_SPOTS.find((item) => item.id === mark.id);
    for (const muscle of spot?.muscles ?? []) {
      ids.add(muscle);
    }
  }
  return [...ids];
}

/** About fifteen percent off, still on the plate step. */
export function sorePlannedWeight(weight: number, step: number): number {
  if (!(weight > 0)) {
    return weight;
  }
  const scaled = floorToStep(weight * 0.85, step > 0 ? step : 2.5);
  if (scaled > 0 && scaled < weight) {
    return scaled;
  }
  const fallback = floorToStep(
    weight - (step > 0 ? step : 2.5),
    step > 0 ? step : 2.5,
  );
  return fallback > 0 ? fallback : weight;
}

export function readEaseSoreResult(data: unknown): { eased: number } {
  if (typeof data !== "object" || data == null) {
    return { eased: 0 };
  }
  const eased =
    "easedSets" in data && typeof data.easedSets === "number"
      ? data.easedSets
      : 0;
  return { eased };
}
