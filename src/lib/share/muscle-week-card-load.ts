import {
  buildMuscleWeekCard,
  type MuscleWeekCard,
} from "@/lib/share/muscle-week-card";
import { getMuscleSnapshot } from "@/lib/workout/muscle-load";

export async function loadMuscleWeekCard(
  userId: string,
): Promise<MuscleWeekCard | null> {
  const snapshot = await getMuscleSnapshot(userId, 7);
  return buildMuscleWeekCard(snapshot);
}
