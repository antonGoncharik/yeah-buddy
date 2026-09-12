"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  parseInteger,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { useSessionEdits } from "@/components/workout/use-session-edits";
import { fetchJson, patchJson, postJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, SessionFeel } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { readSessionDetail } from "@/lib/workout/session-payload";

export function useSessionActions({
  detail,
  note,
  drafts,
  sessionUrl,
  applyDetail,
  loadFollowUp,
  setBusy,
  setError,
  setCorrecting,
  setDetail,
  correcting,
}: {
  detail: SessionDetail | null;
  note: string;
  drafts: Record<string, SetDraft>;
  sessionUrl: string;
  applyDetail: (next: SessionDetail) => void;
  loadFollowUp: (sessionDate: string) => Promise<void>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setCorrecting: Dispatch<SetStateAction<boolean>>;
  setDetail: Dispatch<SetStateAction<SessionDetail | null>>;
  correcting: boolean;
}) {
  async function runBusy(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  function applyPayload(data: unknown): SessionDetail | null {
    const next = readSessionDetail(data);
    if (!next) {
      return null;
    }
    writeJson(sessionUrl, data);
    applyDetail(next);
    return next;
  }

  async function complete() {
    if (!detail) {
      return;
    }

    await runBusy(async () => {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/complete`,
        {
          note: note.trim() === "" ? null : note.trim(),
          feel: detail.session.feel,
          sets: Object.entries(drafts).map(([id, draft]) => ({
            id,
            actual_weight: parseDecimal(draft.weight),
            actual_reps:
              detail.session.workout_type === "dynamic"
                ? parseInteger(draft.reps)
                : null,
            actual_seconds:
              detail.session.workout_type === "static"
                ? parseDecimal(draft.seconds)
                : null,
          })),
        },
      );

      const next = applyPayload(data);
      if (next) {
        setCorrecting(false);
        haptic("success");
        await loadFollowUp(next.session.session_date);
      }
    });
  }

  async function saveFeel(feel: SessionFeel | null) {
    if (!detail) {
      return;
    }

    const previous = detail.session.feel;
    setDetail((current) =>
      current ? { ...current, session: { ...current.session, feel } } : current,
    );

    try {
      await patchJson(`/api/sessions/${detail.session.id}`, { feel });
      if (detail.session.status !== "completed" || correcting) {
        return;
      }

      const data = await fetchJson(sessionUrl);
      const next = readSessionDetail(data);
      if (next) {
        applyDetail(next);
        await loadFollowUp(detail.session.session_date);
      }
    } catch (caught) {
      haptic("error");
      setDetail((current) =>
        current
          ? { ...current, session: { ...current.session, feel: previous } }
          : current,
      );
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  const edits = useSessionEdits({
    detail,
    note,
    applyPayload,
    runBusy,
    setError,
    setDetail,
  });

  return {
    complete,
    saveFeel,
    ...edits,
  };
}
