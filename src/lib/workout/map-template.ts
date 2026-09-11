import { isRecord } from "@/lib/read";
import type { WorkoutTemplate } from "@/lib/types";
import { toWorkoutKind } from "@/lib/workout/map-enums";
import { toNumber } from "@/lib/workout/numbers";

export function mapWorkoutTemplate(
  row: Record<string, unknown>,
): WorkoutTemplate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    kind: toWorkoutKind(row.kind),
    sort_order: toNumber(row.sort_order),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function parseWorkoutTemplate(value: unknown): WorkoutTemplate | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapWorkoutTemplate(value);
}
