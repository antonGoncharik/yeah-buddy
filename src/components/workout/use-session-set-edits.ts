"use client";

import { useRef } from "react";

import {
  lastWorkSetId,
  reportSessionEditError,
  type SessionEditBridge,
} from "@/components/workout/session-edit-bridge";
import { deleteJson, postJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { queueMutate } from "@/lib/offline-mutate";
import { haptic } from "@/lib/telegram/haptic";
import { withSetLogged } from "@/lib/workout/session-complete-local";
import type { PatchSetInput } from "@/lib/workout/session-schema";
import {
  sessionDetailUrl,
  sessionExerciseUrl,
  sessionSetUrl,
} from "@/lib/workout/session-urls";

export function useSessionSetEdits({
  detail,
  applyPayload,
  setError,
  setDetail,
}: Pick<
  SessionEditBridge,
  "detail" | "applyPayload" | "setError" | "setDetail"
>) {
  const addingSet = useRef<string | null>(null);

  async function markSet(
    setId: string,
    patch: PatchSetInput,
  ): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }

    const previous = detail;
    const next = withSetLogged(previous, setId, {
      is_completed: patch.is_completed === true,
      actual_weight: patch.actual_weight,
      actual_reps: patch.actual_reps,
      actual_seconds: patch.actual_seconds,
      actual_rir: patch.actual_rir,
    });
    const url = sessionDetailUrl(detail.session.id);
    setDetail(next);
    writeJson(url, next);
    haptic("commit");

    try {
      const data = await queueMutate({
        method: "PATCH",
        url: sessionSetUrl(setId),
        body: patch,
        cacheUrls: [url],
      });
      if (data != null) {
        applyPayload(data);
      }
      return true;
    } catch (caught) {
      haptic("error");
      setDetail(previous);
      writeJson(url, previous);
      reportSessionEditError(setError, caught);
      return false;
    }
  }

  async function dropWorkSet(setId: string): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }
    setError(null);
    try {
      const data = await deleteJson(sessionSetUrl(setId));
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      reportSessionEditError(setError, caught);
      return false;
    }
  }

  async function addWorkSet(sessionExerciseId: string): Promise<string | null> {
    if (detail?.session.status !== "planned" || addingSet.current != null) {
      return null;
    }
    addingSet.current = sessionExerciseId;
    setError(null);
    try {
      const data = await postJson(
        `${sessionExerciseUrl(detail.session.id, sessionExerciseId)}/sets`,
        {},
      );
      const next = applyPayload(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return lastWorkSetId(next, sessionExerciseId);
    } catch (caught) {
      reportSessionEditError(setError, caught);
      return null;
    } finally {
      addingSet.current = null;
    }
  }

  return { markSet, dropWorkSet, addWorkSet };
}
