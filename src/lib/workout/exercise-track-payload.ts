import { isRecord } from "@/lib/read";
import type { ExerciseTrack } from "@/lib/types";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";
import { formatWeight } from "@/lib/workout/numbers";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export const EXERCISE_TRACK_REMOVE_CONFIRM =
  "Убрать килограммы на штанге? Лесенка снова спросит вес в зале.";

export function formatExerciseTrackDraft(track: ExerciseTrack | null): string {
  const current = track ? trackCurrentWeight(track) : null;
  return current != null && current > 0 ? formatWeight(current) : "";
}

export function readExerciseTrackFromApi(data: unknown): ExerciseTrack | null {
  const next = parseExerciseWithMax(isRecord(data) ? data.exercise : null);
  return next?.track ?? null;
}
