import { getUserCalendarToday } from "@/lib/day/writable";
import {
  isPauseDays,
  lighterPlannedWeight,
  type PauseDays,
  pauseUntilDate,
} from "@/lib/retention/pause";
import { mapSettings } from "@/lib/settings/map";
import { getUserSettings } from "@/lib/settings/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/lib/types";
import { getSessionOnDate } from "@/lib/workout/session-read";

export async function savePause(
  userId: string,
  days: PauseDays | null,
): Promise<UserSettings> {
  const today = await getUserCalendarToday(userId);
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("user_settings")
    .update({
      pause_from: days == null ? null : today,
      pause_until: days == null ? null : pauseUntilDate(today, days),
      pause_return_pending: days != null,
      pause_lighten: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Pause save failed");
  }

  return mapSettings(saved.data as Record<string, unknown>);
}

export async function answerPauseReturn(
  userId: string,
  action: "lighten" | "keep",
): Promise<UserSettings> {
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("user_settings")
    .update({
      pause_return_pending: false,
      pause_lighten: action === "lighten",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Pause return failed");
  }

  if (action === "lighten") {
    const today = await getUserCalendarToday(userId);
    const session = await getSessionOnDate(userId, today);
    if (session?.status === "planned") {
      await consumePauseLighten(userId, session.id);
    }
  }

  const settings = await getUserSettings(userId);
  return settings ?? mapSettings(saved.data as Record<string, unknown>);
}

export async function consumePauseLighten(
  userId: string,
  sessionId: string,
): Promise<void> {
  const settings = await getUserSettings(userId);
  if (!settings?.pause_lighten) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const loaded = await supabase
    .from("session_exercises")
    .select(
      "id, exercises(weight_step), workout_sets(id, planned_weight, is_completed)",
    )
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (loaded.error) {
    throw loaded.error;
  }

  for (const row of loaded.data ?? []) {
    const exercise = firstRecord(row.exercises);
    const step = Number(exercise?.weight_step);
    const sets = Array.isArray(row.workout_sets) ? row.workout_sets : [];
    for (const set of sets) {
      if (!isRecord(set) || set.is_completed === true) {
        continue;
      }
      const weight = Number(set.planned_weight);
      if (!(weight > 0) || typeof set.id !== "string") {
        continue;
      }
      const next = lighterPlannedWeight(
        weight,
        Number.isFinite(step) ? step : 0,
      );
      if (next === weight) {
        continue;
      }
      const updated = await supabase
        .from("workout_sets")
        .update({ planned_weight: next })
        .eq("user_id", userId)
        .eq("id", set.id);
      if (updated.error) {
        throw updated.error;
      }
    }
  }

  const cleared = await supabase
    .from("user_settings")
    .update({
      pause_lighten: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (cleared.error) {
    throw cleared.error;
  }
}

export function readPauseDays(value: unknown): PauseDays | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && isPauseDays(value)) {
    return value;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }
  return isRecord(value) ? value : null;
}
