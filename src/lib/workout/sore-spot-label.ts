import { SORE_SPOTS, type SoreSpotId } from "@/lib/workout/sore";

export function soreSpotLabel(id: SoreSpotId): string {
  return SORE_SPOTS.find((spot) => spot.id === id)?.label ?? id;
}
