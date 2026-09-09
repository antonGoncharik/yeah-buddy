import type {
  CurrentMacroState,
  ExerciseWithMax,
  PhaseCircleProgress,
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { readPhaseCircle } from "@/lib/workout/hints";

export function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
}

export function readTemplates(data: unknown): WorkoutTemplateDetail[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("templates" in data) ||
    !Array.isArray(data.templates)
  ) {
    return [];
  }

  return data.templates as WorkoutTemplateDetail[];
}

export function readMacro(data: unknown): CurrentMacroState | null {
  if (!data || typeof data !== "object" || !("macro" in data)) {
    return null;
  }

  return data as CurrentMacroState;
}

export function readCanUnskip(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === "object" &&
      "can_unskip" in data &&
      data.can_unskip === true,
  );
}

export function readCanBackfillYesterday(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === "object" &&
      "can_backfill_yesterday" in data &&
      data.can_backfill_yesterday === true,
  );
}

export function readTodaySession(data: unknown): WorkoutSession | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data.session as WorkoutSession;
}

export function readTemplate(
  data: unknown,
  key: "next_template" | "session_template" | "following_template",
): WorkoutTemplateDetail | null {
  if (!data || typeof data !== "object" || !(key in data)) {
    return null;
  }

  const value = (data as Record<string, unknown>)[key];
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as WorkoutTemplateDetail;
}

export function readUnfinished(data: unknown): RecentWorkoutSession[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("unfinished" in data) ||
    !Array.isArray(data.unfinished)
  ) {
    return [];
  }

  return data.unfinished as RecentWorkoutSession[];
}

export function readRecent(data: unknown): RecentWorkoutSession[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("recent" in data) ||
    !Array.isArray(data.recent)
  ) {
    return [];
  }

  return data.recent as RecentWorkoutSession[];
}

export function readHubSessionState(data: unknown): {
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  followingTemplate: WorkoutTemplateDetail | null;
  unfinished: RecentWorkoutSession[];
  recent: RecentWorkoutSession[];
  phaseCircle: PhaseCircleProgress | null;
  canUnskip: boolean;
  canBackfillYesterday: boolean;
} {
  return {
    session: readTodaySession(data),
    sessionTemplate: readTemplate(data, "session_template"),
    nextTemplate: readTemplate(data, "next_template"),
    followingTemplate: readTemplate(data, "following_template"),
    unfinished: readUnfinished(data),
    recent: readRecent(data),
    phaseCircle: readPhaseCircle(data),
    canUnskip: readCanUnskip(data),
    canBackfillYesterday: readCanBackfillYesterday(data),
  };
}

export function isRestFoodDay(data: unknown): boolean {
  if (!data || typeof data !== "object" || !("day" in data) || !data.day) {
    return false;
  }

  const day = data.day as { is_training_day?: unknown };
  return day.is_training_day === false;
}
