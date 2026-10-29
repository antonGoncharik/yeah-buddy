"use client";

import { type Dispatch, type SetStateAction, useRef } from "react";

import type { SetDraft } from "@/components/workout/session-drafts";
import { useSessionCompleteActions } from "@/components/workout/use-session-complete-actions";
import { useSessionEdits } from "@/components/workout/use-session-edits";
import { writeJson } from "@/lib/api-cache";
import type { SessionDetail } from "@/lib/types";
import { sessionFailAction } from "@/lib/workout/session-action-errors";
import { preferLiveCompleted } from "@/lib/workout/session-complete-local";
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
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const completing = useRef(false);

  async function runBusy(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      sessionFailAction((message) => setError(message), caught);
    } finally {
      setBusy(false);
    }
  }

  function applyPayload(data: unknown): SessionDetail | null {
    const parsed = readSessionDetail(data);
    if (!parsed) {
      return null;
    }
    const next = preferLiveCompleted(detailRef.current, parsed);
    writeJson(sessionUrl, next);
    applyDetail(next);
    return next;
  }

  const { complete, saveFeel } = useSessionCompleteActions({
    detailRef,
    completing,
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
  });

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
