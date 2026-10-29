import type { MuscleId } from "@/lib/types";

export type SessionSwapOption = {
  exerciseId: string;
  name: string;
  line: string | null;
};

export function readSessionSwapOptions(data: unknown): {
  muscle: string | null;
  muscleId: MuscleId | null;
  options: SessionSwapOption[];
} {
  if (typeof data !== "object" || data == null) {
    return { muscle: null, muscleId: null, options: [] };
  }
  const muscle =
    "muscle" in data && typeof data.muscle === "string" ? data.muscle : null;
  const muscleId =
    "muscleId" in data && typeof data.muscleId === "string"
      ? (data.muscleId as MuscleId)
      : null;
  const raw =
    "options" in data && Array.isArray(data.options) ? data.options : [];
  const options = raw.flatMap((item) => {
    if (typeof item !== "object" || item == null) {
      return [];
    }
    if (!("exerciseId" in item) || typeof item.exerciseId !== "string") {
      return [];
    }
    if (!("name" in item) || typeof item.name !== "string") {
      return [];
    }
    const line =
      "line" in item && typeof item.line === "string" ? item.line : null;
    return [{ exerciseId: item.exerciseId, name: item.name, line }];
  });
  return { muscle, muscleId, options };
}
