import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ScheduleWorkoutType, WorkoutScheduleDay } from "@/lib/types";
import { toNumber } from "@/lib/workout/numbers";

const DEFAULT_TRAINING_DAYS = new Set([1, 3, 5]);

export const schedulePatchSchema = z.object({
  days: z
    .array(
      z.object({
        day_of_week: z.number().int().min(1).max(7),
        workout_type: z.enum(["dynamic", "static", "rest"]),
      }),
    )
    .length(7),
});

export type SchedulePatch = z.infer<typeof schedulePatchSchema>;

export async function ensureSchedule(
  userId: string,
): Promise<WorkoutScheduleDay[]> {
  const existing = await listSchedule(userId);
  if (existing.length === 7) {
    return existing;
  }

  const supabase = createSupabaseServerClient();
  const missing = [1, 2, 3, 4, 5, 6, 7].filter(
    (day) => !existing.some((row) => row.day_of_week === day),
  );

  if (missing.length > 0) {
    const inserted = await supabase.from("workout_schedule").insert(
      missing.map((day_of_week) => ({
        user_id: userId,
        day_of_week,
        workout_type: DEFAULT_TRAINING_DAYS.has(day_of_week)
          ? "dynamic"
          : "rest",
      })),
    );

    if (inserted.error && inserted.error.code !== "23505") {
      throw inserted.error;
    }
  }

  return listSchedule(userId);
}

export async function listSchedule(
  userId: string,
): Promise<WorkoutScheduleDay[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_schedule")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_week", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapScheduleDay(row as Record<string, unknown>),
  );
}

export async function saveSchedule(
  userId: string,
  patch: SchedulePatch,
): Promise<WorkoutScheduleDay[]> {
  await ensureSchedule(userId);
  const supabase = createSupabaseServerClient();

  for (const day of patch.days) {
    const updated = await supabase
      .from("workout_schedule")
      .update({ workout_type: day.workout_type, is_active: true })
      .eq("user_id", userId)
      .eq("day_of_week", day.day_of_week);

    if (updated.error) {
      throw updated.error;
    }
  }

  return listSchedule(userId);
}

export function isoDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = utc.getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function mapScheduleDay(
  row: Record<string, unknown>,
): WorkoutScheduleDay {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    day_of_week: toNumber(row.day_of_week),
    workout_type: toScheduleType(row.workout_type),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function toScheduleType(value: unknown): ScheduleWorkoutType {
  if (value === "dynamic" || value === "static" || value === "rest") {
    return value;
  }

  return "rest";
}
