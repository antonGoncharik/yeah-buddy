import { getUserCalendarToday } from "@/lib/day/writable";
import { UNIQUE_VIOLATION } from "@/lib/seed-missing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MaxSource, SessionFeel } from "@/lib/types";
import { cycleDef, sortOrderForPhase } from "@/lib/workout/cycle";
import {
  cycleCanDeload,
  type EaseWeekKind,
  easedPlanningMax,
  easeWeekKind,
} from "@/lib/workout/ease-week";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import { easeExerciseTrack } from "@/lib/workout/exercise-tracks";
import {
  correctStartingMax,
  listGlobalMaxes,
  pickCurrentMax,
} from "@/lib/workout/global-maxes";
import { createPhase } from "@/lib/workout/macro-create";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { toSessionFeel } from "@/lib/workout/map-enums";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-rebuild";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export class EaseWeekError extends Error {}

const ALREADY = "Лёгкую неделю уже не предложить.";

export async function resolveEaseWeek(
  userId: string,
): Promise<{ kind: EaseWeekKind | null; sessionId: string | null }> {
  const [state, settings] = await Promise.all([
    getCurrentMacroState(userId),
    ensureWorkoutSettings(userId),
  ]);
  return easeOfferFor({
    userId,
    phaseId: state.phase?.id ?? null,
    phaseType: state.phase?.phase_type ?? null,
    deloadTaken: state.phases.some((phase) => phase.phase_type === "deload"),
    cycle: settings.formulas.cycle,
  });
}

async function easeOfferFor(input: {
  userId: string;
  phaseId: string | null;
  phaseType: string | null;
  deloadTaken: boolean;
  cycle: ReadonlyArray<{ key: string }>;
}): Promise<{ kind: EaseWeekKind | null; sessionId: string | null }> {
  const streak = await loadEaseStreak(input.userId, input.phaseId);
  const kind = easeWeekKind({
    feels: streak.feels,
    eased: streak.eased,
    inCycle: input.phaseId != null,
    canDeload: cycleCanDeload({
      cycle: input.cycle,
      phaseType: input.phaseType,
      deloadTaken: input.deloadTaken,
    }),
  });
  return {
    kind,
    sessionId: kind ? streak.sessionId : null,
  };
}

export async function applyEaseWeek(
  userId: string,
  sessionId: string,
): Promise<EaseWeekKind> {
  const session = await loadOwnedSession(userId, sessionId);
  if (session?.status !== "completed") {
    throw new EaseWeekError("Сначала закончи тренировку.");
  }

  const offer = await resolveEaseWeek(userId);
  if (offer.kind == null || offer.sessionId !== sessionId) {
    throw new EaseWeekError(ALREADY);
  }

  if (offer.kind === "deload") {
    await startDeloadWeek(userId);
  } else {
    await easeSessionWeights(userId, sessionId);
  }

  const supabase = createSupabaseServerClient();
  const marked = await supabase
    .from("workout_sessions")
    .update({ ease_applied: true })
    .eq("user_id", userId)
    .eq("id", sessionId);

  if (marked.error) {
    throw marked.error;
  }

  await rebuildTodaysPlannedSession(userId);
  return offer.kind;
}

async function startDeloadWeek(userId: string): Promise<void> {
  const state = await getCurrentMacroState(userId);
  if (!state.macro || !state.phase) {
    throw new EaseWeekError("Нет текущей недели.");
  }
  if (
    state.phase.phase_type === "deload" ||
    state.phases.some((phase) => phase.phase_type === "deload")
  ) {
    throw new EaseWeekError("Лёгкая неделя в этом цикле уже была.");
  }

  const settings = await ensureWorkoutSettings(userId);
  const cycle = settings.formulas.cycle;
  if (cycle.length > 0 && !cycle.some((phase) => phase.key === "deload")) {
    throw new EaseWeekError("В цикле нет лёгкой недели.");
  }

  const today = await getUserCalendarToday(userId);
  const supabase = createSupabaseServerClient();
  const closed = await supabase
    .from("workout_phases")
    .update({ status: "completed", end_date: today })
    .eq("id", state.phase.id)
    .eq("user_id", userId)
    .eq("status", "current");

  if (closed.error) {
    throw closed.error;
  }

  try {
    await createPhase(userId, {
      macroId: state.macro.id,
      phaseType: "deload",
      name: cycleDef(cycle, "deload")?.name ?? null,
      sortOrder: sortOrderForPhase("deload", cycle, state.phases.length + 1),
      startDate: today,
      maxes: phaseMaxes(state.maxes),
    });
  } catch (error) {
    if (isUnique(error)) {
      throw new EaseWeekError("Лёгкая неделя в этом цикле уже была.");
    }
    throw error;
  }
}

function phaseMaxes(
  rows: Awaited<ReturnType<typeof getCurrentMacroState>>["maxes"],
): Array<{ exercise_id: string; max_weight: number; source: MaxSource }> {
  return rows.flatMap((row) => {
    const weight =
      row.phase_max?.max_weight ?? row.exercise.current_max?.max_weight ?? null;
    if (weight == null || !(weight > 0)) {
      return [];
    }
    return [
      {
        exercise_id: row.exercise.id,
        max_weight: weight,
        source: "auto" as const,
      },
    ];
  });
}

async function loadOwnedSession(userId: string, sessionId: string) {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", sessionId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }
  if (!result.data) {
    return null;
  }
  return mapWorkoutSession(result.data as Record<string, unknown>);
}

async function easeSessionWeights(
  userId: string,
  sessionId: string,
): Promise<void> {
  const session = await loadOwnedSession(userId, sessionId);
  if (!session) {
    throw new EaseWeekError(ALREADY);
  }
  if (session.phase_id) {
    throw new EaseWeekError(
      "Пока идёт цикл, легче становится следующая неделя.",
    );
  }

  const detail = await loadSessionDetail(userId, session);
  let changed = 0;
  for (const item of detail.exercises) {
    const step = item.exercise.weight_step;
    if (item.track_id) {
      if (await easeExerciseTrack(userId, item.exercise_id, step)) {
        changed += 1;
      }
      continue;
    }
    if (item.max_weight == null || !(item.max_weight > 0)) {
      continue;
    }
    const history = await listGlobalMaxes(userId, [item.exercise_id]);
    const current =
      pickCurrentMax(history.get(item.exercise_id) ?? [])?.max_weight ??
      item.max_weight;
    const next = easedPlanningMax(current, step);
    if (next == null) {
      continue;
    }
    try {
      await correctStartingMax({
        userId,
        exerciseId: item.exercise_id,
        maxWeight: next,
      });
      changed += 1;
    } catch (error) {
      if (error instanceof StartingMaxLockedError) {
        throw new EaseWeekError(
          "Пока идёт цикл, легче становится следующая неделя.",
        );
      }
      throw error;
    }
  }

  if (changed === 0) {
    throw new EaseWeekError("Нечего снижать.");
  }
}

async function loadEaseStreak(
  userId: string,
  phaseId: string | null,
): Promise<{
  feels: Array<SessionFeel | null>;
  sessionId: string | null;
  eased: boolean;
}> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select("id, feel, ease_applied")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  if (phaseId) {
    query = query.eq("phase_id", phaseId);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const rows = [...(result.data ?? [])].reverse();
  const newest = rows.at(-1);
  return {
    feels: rows.map((row) => toSessionFeel(row.feel)),
    sessionId: typeof newest?.id === "string" ? newest.id : null,
    eased: newest?.ease_applied === true,
  };
}

function isUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  );
}
