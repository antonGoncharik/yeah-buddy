import { previousIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  RecentWorkoutSession,
  TodayWorkoutState,
  WorkoutSession,
} from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { listSessionHistory } from "@/lib/workout/session-history";
import { templateNamesById } from "@/lib/workout/session-names";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  getNextTemplate,
  getTemplate,
  listActiveTemplates,
  templateAfter,
} from "@/lib/workout/templates";

export async function listSessionsOnDate(
  userId: string,
  date: string,
): Promise<WorkoutSession[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", date)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
}

export async function getSessionOnDate(
  userId: string,
  date: string,
): Promise<WorkoutSession | null> {
  const sessions = await listSessionsOnDate(userId, date);
  return sessions[0] ?? null;
}

export async function getSession(
  userId: string,
  id: string,
): Promise<WorkoutSession | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapWorkoutSession(result.data as Record<string, unknown>);
}

export async function getTodayWorkoutState(
  userId: string,
  date: string,
): Promise<TodayWorkoutState> {
  const settings = await ensureWorkoutSettings(userId);
  await ensureStarterExercises(createSupabaseServerClient(), userId);
  const onDate = await listSessionsOnDate(userId, date);
  const gym = onDate[0] ?? null;
  const macro = await getCurrentMacroState(userId);
  const nextTemplate = await getNextTemplate(userId, macro.phase?.id ?? null);
  const active = await listActiveTemplates(userId);
  const followingTemplate =
    nextTemplate && active.length > 1
      ? templateAfter(active, nextTemplate.id)
      : null;
  const sessionTemplate = gym?.template_id
    ? await getTemplate(userId, gym.template_id)
    : null;

  const yesterdayGym = await getSessionOnDate(userId, previousIsoDate(date));

  return {
    session: gym,
    next_template: nextTemplate,
    following_template:
      followingTemplate && followingTemplate.id !== nextTemplate?.id
        ? followingTemplate
        : null,
    session_template: sessionTemplate,
    unfinished: await listUnfinishedGym(userId, date),
    recent: await listSessionHistory(userId, {
      limit: 5,
      statuses: ["completed"],
    }).then((page) => page.items),
    can_unskip: settings.skip_template_ids.length > 0,
    can_backfill_yesterday: yesterdayGym == null,
    phase_circle: macro.phase_circle,
  };
}

async function listUnfinishedGym(
  userId: string,
  exceptDate: string,
): Promise<RecentWorkoutSession[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "planned")
    .neq("session_date", exceptDate)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (result.error) {
    throw result.error;
  }

  const sessions = (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
  const names = await templateNamesById(
    userId,
    sessions.flatMap((session) =>
      session.template_id ? [session.template_id] : [],
    ),
  );

  return sessions.map((session) => ({
    session,
    template_name: session.template_id
      ? (names.get(session.template_id) ?? null)
      : null,
    summary: null,
    plan_hit: 0,
    plan_total: 0,
  }));
}
