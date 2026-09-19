import { cachedGet, peekJson, writeJson } from "@/lib/api-cache";
import { tempId } from "@/lib/day/optimistic";
import { isRecord } from "@/lib/read";
import type {
  ExerciseWithMax,
  SessionDetail,
  SessionExerciseDetail,
  WorkoutFormulas,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { cycleDrivesTracks } from "@/lib/workout/cycle";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  templateMissingMaxes,
  templateMissingTracks,
} from "@/lib/workout/hints";
import {
  parseTemplateDetail,
  readExercises,
  readMacro,
  readTemplates,
} from "@/lib/workout/hub-payload";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import {
  plannedSetsForSlot,
  slotFor,
  slotNeedsMax,
  slotNeedsTrack,
} from "@/lib/workout/slot-plan";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export function sessionDateUrl(date: string): string {
  return `/api/sessions?date=${encodeURIComponent(date)}`;
}

export function sessionDetailUrl(id: string): string {
  return `/api/sessions/${id}`;
}

const GYM_CACHE_URLS = [
  "/api/exercises?filter=active",
  "/api/templates",
  "/api/macros",
  "/api/workout-settings",
] as const;

export function prefetchGymCache(): void {
  for (const url of GYM_CACHE_URLS) {
    void cachedGet(url, () => true).catch(() => undefined);
  }
}

export function peekWorkoutTemplate(
  templateId: string,
  date: string,
): WorkoutTemplateDetail | null {
  const hub = peekJson(sessionDateUrl(date));
  if (isRecord(hub)) {
    for (const key of [
      "next_template",
      "session_template",
      "following_template",
    ] as const) {
      const parsed = parseTemplateDetail(hub[key]);
      if (parsed?.id === templateId) {
        return parsed;
      }
    }
  }

  return (
    readTemplates(peekJson("/api/templates")).find(
      (item) => item.id === templateId,
    ) ?? null
  );
}

export function peekWorkoutCatalog(): ExerciseWithMax[] {
  return readExercises(peekJson("/api/exercises?filter=active"));
}

export function peekWorkoutFormulas(): WorkoutFormulas {
  return (
    readWorkoutSettingsPayload(peekJson("/api/workout-settings"))?.formulas ??
    DEFAULT_WORKOUT_FORMULAS
  );
}

export function sessionDetailFromTemplate({
  sessionId,
  date,
  template,
  catalog,
  formulas,
}: {
  sessionId?: string;
  date: string;
  template: WorkoutTemplateDetail;
  catalog?: ExerciseWithMax[];
  formulas?: WorkoutFormulas;
}): SessionDetail {
  const id = sessionId ?? tempId("session");
  const now = new Date().toISOString();
  const exercises = catalog ?? peekWorkoutCatalog();
  const planFormulas = formulas ?? peekWorkoutFormulas();
  const macro = readMacro(peekJson("/api/macros"));
  const phaseKey = macro?.phase?.phase_type ?? null;
  const byId = new Map(exercises.map((item) => [item.id, item]));
  const maxByExercise = maxesFromCache(exercises, macro?.maxes ?? []);

  const session: WorkoutSession = {
    id,
    user_id: "",
    session_date: date,
    macro_cycle_id: macro?.macro?.id ?? null,
    phase_id: macro?.phase?.id ?? null,
    workout_type: template.kind,
    template_id: template.id,
    status: "planned",
    note: null,
    feel: null,
    created_at: now,
  };

  const planned: SessionExerciseDetail[] = [];
  let sortOrder = 10;
  for (const exercise of template.exercises) {
    const catalogRow = byId.get(exercise.id);
    const plan = slotFor(template.slots, exercise.id);
    const maxWeight = maxByExercise.get(exercise.id) ?? null;
    const track = catalogRow?.track ?? null;
    const rows = plannedSetsForSlot(plan, {
      kind: template.kind,
      exercise,
      formulas: planFormulas,
      phaseKey,
      maxWeight,
      trackWeight: track ? trackCurrentWeight(track) : null,
      feelWeight: null,
    });
    if (rows == null) {
      continue;
    }

    const sessionExerciseId = tempId("sex");
    const usesTrack = track != null && slotNeedsTrack(plan, phaseKey);
    planned.push({
      id: sessionExerciseId,
      user_id: "",
      session_id: id,
      exercise_id: exercise.id,
      sort_order: sortOrder,
      max_weight: slotNeedsMax(plan, exercise, phaseKey) ? maxWeight : null,
      intensity: plan?.intensity ?? null,
      note: plan?.note ?? null,
      track_id: usesTrack && track ? track.id : null,
      track_step: usesTrack && track ? track.position : null,
      created_at: now,
      exercise,
      previous: null,
      sets: rows.map((row) => setFromPlan(row, sessionExerciseId, now)),
    });
    sortOrder += 10;
  }

  const plannedIds = planned.map((item) => item.exercise_id);
  const weekly = cycleDrivesTracks(planFormulas.cycle);

  return {
    session,
    template: asTemplate(template),
    phase: macro?.phase ?? null,
    exercises: planned,
    missing_maxes: templateMissingMaxes(
      template,
      exercises,
      plannedIds,
      phaseKey,
    ),
    missing_tracks: templateMissingTracks(
      template,
      exercises,
      plannedIds,
      phaseKey,
    ),
    tracks: planned.flatMap((item) => {
      const catalogRow = byId.get(item.exercise_id);
      if (!catalogRow || item.track_id == null || item.track_step == null) {
        return [];
      }
      const weight = catalogRow.track
        ? trackCurrentWeight(catalogRow.track)
        : null;
      const next =
        weight != null && !weekly
          ? Math.round((weight + catalogRow.weight_step) * 100) / 100
          : null;
      return [
        {
          exercise_id: item.exercise_id,
          name: exerciseShortLabel(catalogRow.short_name, catalogRow.name),
          step: 1,
          total: 1,
          weight,
          next_weight: next,
          finished: false,
        },
      ];
    }),
    raise_offers: [],
  };
}

export function sessionIdMap(
  local: SessionDetail,
  real: SessionDetail,
): Map<string, string> {
  const map = new Map<string, string>();
  if (local.session.id !== real.session.id) {
    map.set(local.session.id, real.session.id);
  }
  for (const localEx of local.exercises) {
    const realEx = real.exercises.find(
      (item) => item.exercise_id === localEx.exercise_id,
    );
    if (!realEx) {
      continue;
    }
    if (localEx.id !== realEx.id) {
      map.set(localEx.id, realEx.id);
    }
    for (const localSet of localEx.sets) {
      const realSet = realEx.sets.find(
        (item) => item.set_number === localSet.set_number,
      );
      if (realSet && localSet.id !== realSet.id) {
        map.set(localSet.id, realSet.id);
      }
    }
  }
  return map;
}

export function writeLocalSession(detail: SessionDetail): void {
  writeJson(sessionDetailUrl(detail.session.id), detail);
  writeHubSession(detail.session.session_date, detail.session, detail.template);
}

export function writeHubSession(
  date: string,
  session: WorkoutSession,
  template?: WorkoutTemplate | null,
): void {
  const url = sessionDateUrl(date);
  const current = peekJson(url);
  const payload: Record<string, unknown> = isRecord(current)
    ? { ...current, session }
    : { session };
  if (template) {
    payload.session_template = template;
  }
  writeJson(url, payload);
}

function setFromPlan(
  row: {
    set_type: "warmup" | "work";
    set_number: number;
    planned_weight: number | null;
    planned_reps: number | null;
    planned_reps_to: number | null;
    planned_seconds: number | null;
    planned_rir: number | null;
  },
  sessionExerciseId: string,
  now: string,
): WorkoutSet {
  return {
    id: tempId("set"),
    user_id: "",
    session_exercise_id: sessionExerciseId,
    set_type: row.set_type,
    set_number: row.set_number,
    planned_weight: row.planned_weight,
    planned_reps: row.planned_reps,
    planned_reps_to: row.planned_reps_to,
    planned_seconds: row.planned_seconds,
    planned_rir: row.planned_rir,
    actual_weight: null,
    actual_reps: null,
    actual_seconds: null,
    actual_rir: null,
    is_completed: false,
    logged: false,
    created_at: now,
  };
}

function asTemplate(template: WorkoutTemplateDetail): WorkoutTemplate {
  return {
    id: template.id,
    user_id: template.user_id,
    name: template.name,
    kind: template.kind,
    sort_order: template.sort_order,
    is_active: template.is_active,
    created_at: template.created_at,
    updated_at: template.updated_at,
  };
}

function maxesFromCache(
  catalog: ExerciseWithMax[],
  phaseMaxes: Array<{
    exercise: ExerciseWithMax;
    phase_max: { max_weight: number } | null;
  }>,
): Map<string, number> {
  const maxByExercise = new Map<string, number>();
  for (const row of catalog) {
    const weight = row.current_max?.max_weight ?? 0;
    if (weight > 0) {
      maxByExercise.set(row.id, weight);
    }
  }
  for (const row of phaseMaxes) {
    const weight =
      row.phase_max?.max_weight ?? row.exercise.current_max?.max_weight ?? 0;
    if (weight > 0) {
      maxByExercise.set(row.exercise.id, weight);
    }
  }
  return maxByExercise;
}
