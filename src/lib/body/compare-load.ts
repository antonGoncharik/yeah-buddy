import {
  averageSide,
  bodyCompareCaption,
  compareLifts,
} from "@/lib/body/compare";
import { shiftIsoDate } from "@/lib/day/dates";
import { listDaysInRange } from "@/lib/day/history";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loadBodyCompare(
  userId: string,
  thenDate: string,
  nowDate: string,
): Promise<string | null> {
  const [thenDays, nowDays, thenLifts, nowLifts] = await Promise.all([
    listDaysInRange(
      userId,
      shiftIsoDate(thenDate, -3),
      shiftIsoDate(thenDate, 3),
    ),
    listDaysInRange(userId, shiftIsoDate(nowDate, -3), nowDate),
    liftsAround(userId, shiftIsoDate(thenDate, -7), shiftIsoDate(thenDate, 7)),
    liftsAround(userId, shiftIsoDate(nowDate, -7), nowDate),
  ]);

  return bodyCompareCaption({
    before: averageSide(thenDays),
    now: averageSide(nowDays),
    lifts: compareLifts(thenLifts, nowLifts),
  });
}

async function liftsAround(
  userId: string,
  start: string,
  end: string,
): Promise<Array<{ name: string; weight: number }>> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select(
      "session_exercises(exercises(name), workout_sets(set_type, actual_weight, is_completed))",
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("session_date", start)
    .lte("session_date", end);

  if (result.error) {
    throw result.error;
  }

  const best = new Map<string, number>();
  for (const session of result.data ?? []) {
    const rows = Array.isArray(session.session_exercises)
      ? session.session_exercises
      : [];
    for (const row of rows) {
      if (typeof row !== "object" || row == null) {
        continue;
      }
      const exercise = "exercises" in row ? row.exercises : null;
      const named = Array.isArray(exercise) ? exercise[0] : exercise;
      const name =
        typeof named === "object" &&
        named != null &&
        "name" in named &&
        typeof named.name === "string"
          ? named.name
          : null;
      if (!name) {
        continue;
      }
      const sets =
        "workout_sets" in row && Array.isArray(row.workout_sets)
          ? row.workout_sets
          : [];
      for (const set of sets) {
        if (typeof set !== "object" || set == null) {
          continue;
        }
        if (set.set_type !== "work" || set.is_completed !== true) {
          continue;
        }
        const weight = Number(set.actual_weight);
        if (!(weight > 0)) {
          continue;
        }
        best.set(name, Math.max(best.get(name) ?? 0, weight));
      }
    }
  }

  return [...best.entries()].map(([name, weight]) => ({ name, weight }));
}
