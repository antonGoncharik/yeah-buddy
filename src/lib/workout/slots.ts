import type { WorkoutKind, WorkoutSlot } from "@/lib/types";
import { SLOT_ROTATION } from "@/lib/workout/labels";

export function isWorkoutSlot(value: unknown): value is WorkoutSlot {
  return value === "a" || value === "b" || value === "c" || value === "static";
}

export function kindFromSlot(slot: WorkoutSlot): WorkoutKind {
  return slot === "static" ? "static" : "dynamic";
}

export function nextSlotAfter(slot: WorkoutSlot | null): WorkoutSlot {
  if (!slot) {
    return "a";
  }

  const index = SLOT_ROTATION.indexOf(slot);
  if (index < 0) {
    return "a";
  }

  return SLOT_ROTATION[(index + 1) % SLOT_ROTATION.length];
}
