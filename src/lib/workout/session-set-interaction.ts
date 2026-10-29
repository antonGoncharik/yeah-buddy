import {
  loggedSetPatch,
  plannedLogPatch,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { workSetsNeedRest } from "@/lib/workout/rest-timer";
import { nextFocusSetId } from "@/lib/workout/session-pairs";

export async function toggleSessionSet({
  set,
  exerciseId,
  sessionExerciseId,
  draft,
  pairs,
  exercises,
  marking,
  markSet,
  openEditor,
  focusSet,
  startRest,
}: {
  set: WorkoutSet;
  exerciseId: string;
  sessionExerciseId: string;
  draft: SetDraft | undefined;
  pairs: Record<string, string>;
  exercises: SessionDetail["exercises"];
  marking: { current: Set<string> };
  markSet: (
    setId: string,
    patch: {
      is_completed: boolean;
      actual_weight?: number | null;
      actual_reps?: number | null;
      actual_seconds?: number | null;
      actual_rir?: number | null;
    },
  ) => Promise<boolean>;
  openEditor: (setId: string) => void;
  focusSet: (setId: string) => void;
  startRest: (exerciseId: string) => void;
}) {
  if (marking.current.has(set.id)) {
    return;
  }
  if (!set.is_completed) {
    const patch = loggedSetPatch(set, draft);
    if (!patch) {
      haptic("warn");
      openEditor(set.id);
      return;
    }
    marking.current.add(set.id);
    try {
      const ok = await markSet(set.id, { is_completed: true, ...patch });
      if (ok && set.set_type === "work") {
        const nextId = nextFocusSetId(
          exercises,
          sessionExerciseId,
          set.id,
          pairs[sessionExerciseId] ?? null,
        );
        if (nextId) {
          focusSet(nextId);
        }
        const restExerciseId =
          exerciseIdForSet(exercises, nextId) ?? exerciseId;
        startRest(restExerciseId);
      }
    } finally {
      marking.current.delete(set.id);
    }
    return;
  }

  marking.current.add(set.id);
  try {
    await markSet(set.id, { is_completed: false });
  } finally {
    marking.current.delete(set.id);
  }
}

export async function logPlannedSessionSets({
  sessionExerciseId,
  exercises,
  markSet,
  startRest,
}: {
  sessionExerciseId: string;
  exercises: SessionDetail["exercises"];
  markSet: (
    setId: string,
    patch: {
      is_completed: boolean;
      actual_weight?: number | null;
      actual_reps?: number | null;
      actual_seconds?: number | null;
      actual_rir?: number | null;
    },
  ) => Promise<boolean>;
  startRest: (exerciseId: string) => void;
}) {
  const item = exercises.find((row) => row.id === sessionExerciseId);
  if (!item) {
    return;
  }
  const pending = item.sets.flatMap((set) => {
    if (set.set_type !== "work" || set.is_completed) {
      return [];
    }
    const patch = plannedLogPatch(set);
    if (!patch) {
      return [];
    }
    return [{ id: set.id, patch }];
  });
  if (pending.length === 0) {
    return;
  }
  const results: boolean[] = [];
  for (const { id, patch } of pending) {
    results.push(await markSet(id, { is_completed: true, ...patch }));
  }
  if (results.some((ok) => !ok)) {
    return;
  }
  startRest(item.exercise_id);
}

export function exerciseIdForSet(
  exercises: SessionDetail["exercises"],
  setId: string | null,
): string | null {
  if (!setId) {
    return null;
  }
  for (const item of exercises) {
    if (item.sets.some((row) => row.id === setId)) {
      return item.exercise_id;
    }
  }
  return null;
}

export function restExerciseFor(
  detail: SessionDetail,
  openSetIds: string[],
): string | null {
  for (const item of detail.exercises) {
    if (item.sets.some((set) => openSetIds.includes(set.id))) {
      return item.exercise_id;
    }
  }
  for (const item of detail.exercises) {
    const work = item.sets.filter((set) => set.set_type === "work");
    if (workSetsNeedRest(work)) {
      return item.exercise_id;
    }
  }
  return null;
}
