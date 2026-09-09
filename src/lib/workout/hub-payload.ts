import { isRecord, mapRecordList, readKeyedRecord } from "@/lib/read";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { readPhaseCircle } from "@/lib/workout/hints";
import {
  mapExercise,
  mapWorkoutTemplate,
  parseExerciseWithMax,
  parseMacroCycle,
  parseMacroRecap,
  parsePhaseMaxRow,
  parseWorkoutPhase,
  parseWorkoutSession,
} from "@/lib/workout/map-rows";
import { toNumber } from "@/lib/workout/numbers";

export function readExercises(data: unknown): ExerciseWithMax[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.exercises, (row) => parseExerciseWithMax(row));
}

export function readTemplates(data: unknown): WorkoutTemplateDetail[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.templates, parseTemplateDetail);
}

export function readMacro(data: unknown): CurrentMacroState | null {
  return parseCurrentMacroState(data);
}

export function parseCurrentMacroState(
  data: unknown,
): CurrentMacroState | null {
  if (!isRecord(data) || !("macro" in data)) {
    return null;
  }

  return {
    macro: parseMacroCycle(data.macro),
    phase: parseWorkoutPhase(data.phase),
    phases: mapRecordList(data.phases, (row) => parseWorkoutPhase(row)),
    maxes: mapRecordList(data.maxes, parsePhaseMaxRow),
    phase_circle: readPhaseCircle(data),
    last_recap: parseMacroRecap(data.last_recap),
  };
}

export function readCanUnskip(data: unknown): boolean {
  return isRecord(data) && data.can_unskip === true;
}

export function readCanBackfillYesterday(data: unknown): boolean {
  return isRecord(data) && data.can_backfill_yesterday === true;
}

export function readTodaySession(data: unknown): WorkoutSession | null {
  if (!isRecord(data)) {
    return null;
  }

  return parseWorkoutSession(data.session);
}

export function readTemplate(
  data: unknown,
  key: "next_template" | "session_template" | "following_template",
): WorkoutTemplateDetail | null {
  if (!isRecord(data)) {
    return null;
  }

  return parseTemplateDetail(data[key]);
}

export function readUnfinished(data: unknown): RecentWorkoutSession[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.unfinished, parseRecentSession);
}

export function readRecent(data: unknown): RecentWorkoutSession[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.recent, parseRecentSession);
}

export function readHubSessionState(data: unknown): {
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  followingTemplate: WorkoutTemplateDetail | null;
  unfinished: RecentWorkoutSession[];
  recent: RecentWorkoutSession[];
  phaseCircle: ReturnType<typeof readPhaseCircle>;
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
  const day = readKeyedRecord(data, "day");
  return day?.is_training_day === false;
}

export function parseTemplateDetail(
  value: unknown,
): WorkoutTemplateDetail | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    ...mapWorkoutTemplate(value),
    exercises: mapRecordList(value.exercises, (row) =>
      typeof row.id === "string" ? mapExercise(row) : null,
    ),
  };
}

function parseRecentSession(
  row: Record<string, unknown>,
): RecentWorkoutSession | null {
  const session = parseWorkoutSession(row.session);
  if (!session) {
    return null;
  }

  return {
    session,
    template_name:
      typeof row.template_name === "string" ? row.template_name : null,
    summary: typeof row.summary === "string" ? row.summary : null,
    plan_hit: toNumber(row.plan_hit),
    plan_total: toNumber(row.plan_total),
  };
}
