import { NextResponse } from "next/server";

import { failRoute } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sessionsToCsv } from "@/lib/workout/sessions-csv";

export const GET = sessionRoute(async (session) => {
  try {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from("workout_sets")
      .select(
        "set_number, actual_weight, actual_reps, session_exercises!inner(exercises!inner(name), workout_sessions!inner(session_date, status, user_id))",
      )
      .eq("user_id", session.userId)
      .eq("session_exercises.workout_sessions.user_id", session.userId)
      .eq("session_exercises.workout_sessions.status", "completed")
      .order("set_number", { ascending: true })
      .limit(5000);

    if (result.error) {
      throw result.error;
    }

    const rows = (result.data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const exerciseJoin = record.session_exercises;
      const exercise = Array.isArray(exerciseJoin)
        ? exerciseJoin[0]
        : exerciseJoin;
      const nested =
        exercise && typeof exercise === "object"
          ? (exercise as Record<string, unknown>)
          : {};
      const named = nested.exercises;
      const nameRow = Array.isArray(named) ? named[0] : named;
      const sessionJoin = nested.workout_sessions;
      const sessionRow = Array.isArray(sessionJoin)
        ? sessionJoin[0]
        : sessionJoin;
      const date =
        sessionRow &&
        typeof sessionRow === "object" &&
        "session_date" in sessionRow
          ? String(sessionRow.session_date).slice(0, 10)
          : "";
      const exerciseName =
        nameRow && typeof nameRow === "object" && "name" in nameRow
          ? String(nameRow.name)
          : "Упражнение";
      return {
        date,
        exercise: exerciseName,
        setNumber: Number(record.set_number) || 0,
        weight:
          record.actual_weight == null ? null : Number(record.actual_weight),
        reps: record.actual_reps == null ? null : Number(record.actual_reps),
      };
    });

    return new NextResponse(sessionsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="workouts.csv"',
      },
    });
  } catch (error) {
    return failRoute(error);
  }
});
