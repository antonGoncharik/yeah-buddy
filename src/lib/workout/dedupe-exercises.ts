import type { SupabaseClient } from "@supabase/supabase-js";

import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export function exerciseNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export const STARTER_EXERCISE_NAME_KEYS = new Set(
  STARTER_EXERCISES.map((exercise) => exerciseNameKey(exercise.name)),
);

export interface DedupeExerciseCandidate {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  has_max: boolean;
  in_template: boolean;
}

/** Keep one row when starter/preset full names were inserted twice. */
export function pickExerciseKeeper(
  candidates: DedupeExerciseCandidate[],
): DedupeExerciseCandidate {
  if (candidates.length === 0) {
    throw new Error("No exercise candidates to keep");
  }

  const ranked = [...candidates].sort((a, b) => {
    if (a.has_max !== b.has_max) {
      return a.has_max ? -1 : 1;
    }
    if (a.in_template !== b.in_template) {
      return a.in_template ? -1 : 1;
    }
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }
    const byCreated = a.created_at.localeCompare(b.created_at);
    if (byCreated !== 0) {
      return byCreated;
    }
    return a.id.localeCompare(b.id);
  });

  const keeper = ranked[0];
  if (!keeper) {
    throw new Error("No exercise candidates to keep");
  }
  return keeper;
}

/**
 * Collapse duplicate starter-catalog lifts for one user.
 * Only full starter names — not short_name collisions with customs.
 */
export async function dedupeStarterExercises(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const listed = await supabase
    .from("exercises")
    .select("id, name, is_active, created_at")
    .eq("user_id", userId);

  if (listed.error) {
    throw listed.error;
  }

  const rows = (listed.data ?? []).filter(
    (
      row,
    ): row is {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
    } =>
      typeof row.id === "string" &&
      typeof row.name === "string" &&
      typeof row.created_at === "string" &&
      typeof row.is_active === "boolean" &&
      STARTER_EXERCISE_NAME_KEYS.has(exerciseNameKey(row.name)),
  );

  const byKey = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = exerciseNameKey(row.name);
    const group = byKey.get(key) ?? [];
    group.push(row);
    byKey.set(key, group);
  }

  const duplicateGroups = [...byKey.values()].filter(
    (group) => group.length > 1,
  );
  if (duplicateGroups.length === 0) {
    return;
  }

  const allIds = duplicateGroups.flatMap((group) => group.map((row) => row.id));
  const [maxIds, templateIds] = await Promise.all([
    exerciseIdsWithMaxes(supabase, userId, allIds),
    exerciseIdsInTemplates(supabase, userId, allIds),
  ]);

  for (const group of duplicateGroups) {
    const keeper = pickExerciseKeeper(
      group.map((row) => ({
        id: row.id,
        name: row.name,
        is_active: row.is_active,
        created_at: row.created_at,
        has_max: maxIds.has(row.id),
        in_template: templateIds.has(row.id),
      })),
    );
    const losers = group.map((row) => row.id).filter((id) => id !== keeper.id);
    await mergeExerciseDuplicates(supabase, userId, keeper.id, losers);
  }
}

async function exerciseIdsWithMaxes(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[],
): Promise<Set<string>> {
  if (exerciseIds.length === 0) {
    return new Set();
  }
  const result = await supabase
    .from("global_maxes")
    .select("exercise_id")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds);
  if (result.error) {
    throw result.error;
  }
  return new Set(
    (result.data ?? [])
      .map((row) => row.exercise_id)
      .filter((id): id is string => typeof id === "string"),
  );
}

async function exerciseIdsInTemplates(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[],
): Promise<Set<string>> {
  if (exerciseIds.length === 0) {
    return new Set();
  }
  const result = await supabase
    .from("workout_template_exercises")
    .select("exercise_id")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds);
  if (result.error) {
    throw result.error;
  }
  return new Set(
    (result.data ?? [])
      .map((row) => row.exercise_id)
      .filter((id): id is string => typeof id === "string"),
  );
}

async function mergeExerciseDuplicates(
  supabase: SupabaseClient,
  userId: string,
  keeperId: string,
  loserIds: string[],
): Promise<void> {
  for (const loserId of loserIds) {
    await repointOrDrop(
      supabase,
      "workout_template_exercises",
      userId,
      keeperId,
      loserId,
      "template_id",
    );
    await repointOrDrop(
      supabase,
      "session_exercises",
      userId,
      keeperId,
      loserId,
      "session_id",
    );
    await repointOrDrop(
      supabase,
      "exercise_tracks",
      userId,
      keeperId,
      loserId,
      "user_id",
    );
    await repointOrDrop(
      supabase,
      "phase_maxes",
      userId,
      keeperId,
      loserId,
      "phase_id",
    );

    const maxes = await supabase
      .from("global_maxes")
      .update({ exercise_id: keeperId })
      .eq("user_id", userId)
      .eq("exercise_id", loserId);
    if (maxes.error) {
      throw maxes.error;
    }

    const removed = await supabase
      .from("exercises")
      .delete()
      .eq("user_id", userId)
      .eq("id", loserId);
    if (removed.error) {
      throw removed.error;
    }
  }
}

async function repointOrDrop(
  supabase: SupabaseClient,
  table:
    | "workout_template_exercises"
    | "session_exercises"
    | "exercise_tracks"
    | "phase_maxes",
  userId: string,
  keeperId: string,
  loserId: string,
  scopeColumn: "template_id" | "session_id" | "user_id" | "phase_id",
): Promise<void> {
  const loserRows = await supabase
    .from(table)
    .select(`id, ${scopeColumn}`)
    .eq("user_id", userId)
    .eq("exercise_id", loserId);
  if (loserRows.error) {
    throw loserRows.error;
  }

  for (const row of loserRows.data ?? []) {
    const record = row as Record<string, unknown>;
    const rowId = record.id;
    const scopeValue = record[scopeColumn];
    if (typeof rowId !== "string" || typeof scopeValue !== "string") {
      continue;
    }

    const conflict = await supabase
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .eq("exercise_id", keeperId)
      .eq(scopeColumn, scopeValue)
      .limit(1)
      .maybeSingle();
    if (conflict.error) {
      throw conflict.error;
    }

    if (conflict.data) {
      const dropped = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq("id", rowId);
      if (dropped.error) {
        throw dropped.error;
      }
      continue;
    }

    const moved = await supabase
      .from(table)
      .update({ exercise_id: keeperId })
      .eq("user_id", userId)
      .eq("id", rowId);
    if (moved.error) {
      throw moved.error;
    }
  }
}
