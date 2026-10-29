"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";

import type { SetDraft } from "@/components/workout/session-drafts";
import type { SessionDetail, WorkoutSession, WorkoutSet } from "@/lib/types";
import {
  forgetPair,
  pairWith,
  writeSessionPairs,
} from "@/lib/workout/session-pairs";
import {
  logPlannedSessionSets,
  toggleSessionSet,
} from "@/lib/workout/session-set-interaction";

export function useSessionExerciseListHandlers({
  session,
  detail,
  correcting,
  drafts,
  setDrafts,
  setOpenSetIds,
  pairs,
  setPairs,
  markSet,
  addWorkSet,
  dropWorkSet,
  startRest,
}: {
  session: WorkoutSession;
  detail: SessionDetail;
  correcting: boolean;
  drafts: Record<string, SetDraft>;
  setDrafts: Dispatch<SetStateAction<Record<string, SetDraft>>>;
  setOpenSetIds: Dispatch<SetStateAction<string[]>>;
  pairs: Record<string, string>;
  setPairs: Dispatch<SetStateAction<Record<string, string>>>;
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
  addWorkSet: (sessionExerciseId: string) => Promise<string | null>;
  dropWorkSet: (setId: string) => Promise<boolean>;
  startRest: (exerciseId: string) => void;
}) {
  const marking = useRef(new Set<string>());
  const loggingPlan = useRef(false);

  const openEditor = (id: string) => setOpenSetIds([id]);
  const focusSet = openEditor;

  return {
    onToggleSet: (set: WorkoutSet, exerciseId: string) => {
      const row = detail.exercises.find(
        (item) => item.exercise_id === exerciseId,
      );
      void toggleSessionSet({
        set,
        exerciseId,
        sessionExerciseId: row?.id ?? "",
        draft: drafts[set.id],
        pairs,
        exercises: detail.exercises,
        marking,
        markSet,
        openEditor,
        focusSet,
        startRest,
      });
    },
    onLogSet: (set: WorkoutSet, sessionExerciseId: string, draft: SetDraft) => {
      if (session.status === "completed" && correcting) {
        setDrafts((current) => ({ ...current, [set.id]: draft }));
        return;
      }
      const row = detail.exercises.find(
        (item) => item.id === sessionExerciseId,
      );
      void toggleSessionSet({
        set,
        exerciseId: row?.exercise_id ?? "",
        sessionExerciseId,
        draft,
        pairs,
        exercises: detail.exercises,
        marking,
        markSet,
        openEditor,
        focusSet,
        startRest: (id) => startRest(row?.exercise_id ?? id),
      });
    },
    onLogPlan: (sessionExerciseId: string) => {
      if (loggingPlan.current) {
        return;
      }
      loggingPlan.current = true;
      void logPlannedSessionSets({
        sessionExerciseId,
        exercises: detail.exercises,
        markSet,
        startRest,
      }).finally(() => {
        loggingPlan.current = false;
      });
    },
    onDropSet:
      session.status === "planned"
        ? async (setId: string) => {
            const ok = await dropWorkSet(setId);
            if (ok) {
              setOpenSetIds((current) => current.filter((id) => id !== setId));
            }
          }
        : undefined,
    onAddSet:
      session.status === "planned"
        ? async (sessionExerciseId: string) => {
            const setId = await addWorkSet(sessionExerciseId);
            if (setId) {
              setOpenSetIds([setId]);
            }
          }
        : undefined,
    onPair: (leftId: string, rightId: string) => {
      setPairs((current) => {
        const next =
          current[leftId] === rightId
            ? forgetPair(current, leftId)
            : pairWith(current, leftId, rightId);
        writeSessionPairs(session.id, next);
        return next;
      });
    },
  };
}
