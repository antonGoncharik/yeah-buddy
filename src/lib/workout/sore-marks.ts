import type { SoreMark, SoreSpotId } from "@/lib/workout/sore";
import { SORE_SPOTS } from "@/lib/workout/sore";

const STORAGE_KEY = "yeah-buddy-sore";

export function readStoredSoreMarks(): SoreMark[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => parseMark(item));
  } catch {
    return [];
  }
}

export function writeStoredSoreMarks(marks: SoreMark[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
}

function parseMark(item: unknown): SoreMark[] {
  if (typeof item !== "object" || item == null) {
    return [];
  }
  if (!("id" in item) || !("until" in item) || typeof item.until !== "string") {
    return [];
  }
  const spot = SORE_SPOTS.find((row) => row.id === item.id);
  if (!spot) {
    return [];
  }
  const eased =
    "easedSessionIds" in item && Array.isArray(item.easedSessionIds)
      ? item.easedSessionIds.filter(
          (id: unknown): id is string => typeof id === "string",
        )
      : [];
  return [
    { id: spot.id as SoreSpotId, until: item.until, easedSessionIds: eased },
  ];
}
