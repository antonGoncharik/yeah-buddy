"use client";

import { type Dispatch, type SetStateAction, useRef } from "react";

import {
  completeSetOverrides,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { useSessionEdits } from "@/components/workout/use-session-edits";
import { peekJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { queueMutate } from "@/lib/offline-mutate";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, SessionFeel } from "@/lib/types";
import { parseWorkoutSession } from "@/lib/workout/map-rows";
import {
  completeSessionLocally,
  preferLiveCompleted,
  preferLiveFeel,
} from "@/lib/workout/session-complete-local";
import { validateSessionBeforeComplete } from "@/lib/workout/session-complete-validate";
import {
  clearSessionDraft,
  readSessionDraft,
  writeSessionDraft,
} from "@/lib/workout/session-draft-store";
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
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
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

  async function complete() {
    const current = detailRef.current;
    if (!current || completing.current) {
      return;
    }

    const sentFeel = current.session.feel;
    const body = {
      note: note.trim() === "" ? null : note.trim(),
      feel: sentFeel,
      sets: completeSetOverrides(current, drafts),
    };
    try {
      validateSessionBeforeComplete(current, body);
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return;
    }

    completing.current = true;
    setBusy(true);
    const draftSnapshot = readSessionDraft(current.session.id);
    const local = completeSessionLocally(current, body);
    const previous = current;
    writeCompletedCaches(sessionUrl, local);
    applyDetail(local);
    setCorrecting(false);
    setError(null);
    haptic("success");

    try {
      const data = await queueMutate({
        method: "POST",
        url: `/api/sessions/${current.session.id}/complete`,
        body,
        cacheUrls: [sessionUrl, sessionDateUrl(current.session.session_date)],
      });
      clearSessionDraft(current.session.id);
      if (!data) {
        return;
      }
      const parsed = readSessionDetail(data);
      if (!parsed) {
        return;
      }
      const live = detailRef.current;
      const feel = preferLiveFeel(
        live?.session.id === parsed.session.id
          ? live.session.feel
          : parsed.session.feel,
        sentFeel,
        parsed.session.feel,
      );
      const withFeel =
        feel === parsed.session.feel
          ? parsed
          : { ...parsed, session: { ...parsed.session, feel } };
      const next = preferLiveCompleted(live, withFeel);
      writeJson(sessionUrl, next);
      applyDetail(next);
      await loadFollowUp(next.session.session_date);
    } catch (caught) {
      haptic("error");
      if (draftSnapshot) {
        writeSessionDraft(current.session.id, draftSnapshot);
      }
      writeCompletedCaches(sessionUrl, previous);
      applyDetail(previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      completing.current = false;
      setBusy(false);
    }
  }

  async function saveFeel(feel: SessionFeel | null) {
    const current = detailRef.current;
    if (current?.session.status !== "completed" || correcting) {
      return;
    }

    const previous = current.session.feel;
    const optimistic = {
      ...current,
      session: { ...current.session, feel },
    };
    setDetail(optimistic);
    writeCompletedCaches(sessionUrl, optimistic);

    try {
      const data = await queueMutate({
        method: "PATCH",
        url: `/api/sessions/${current.session.id}`,
        body: { feel },
        cacheUrls: [sessionUrl, sessionDateUrl(current.session.session_date)],
      });
      if (data == null) {
        return;
      }

      const patched = isRecord(data) ? parseWorkoutSession(data.session) : null;
      if (!patched || patched.id !== current.session.id) {
        return;
      }

      const live = detailRef.current ?? current;
      const merged = preferLiveCompleted(live, {
        ...live,
        session: patched,
      });
      writeCompletedCaches(sessionUrl, merged);
      applyDetail(merged);
      await loadFollowUp(current.session.session_date);
    } catch (caught) {
      haptic("error");
      const reverted = {
        ...optimistic,
        session: { ...optimistic.session, feel: previous },
      };
      writeCompletedCaches(sessionUrl, reverted);
      setDetail(reverted);
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

function sessionDateUrl(date: string): string {
  return `/api/sessions?date=${encodeURIComponent(date)}`;
}

function writeCompletedCaches(sessionUrl: string, detail: SessionDetail): void {
  writeJson(sessionUrl, detail);
  const hubUrl = sessionDateUrl(detail.session.session_date);
  const current = peekJson(hubUrl);
  writeJson(
    hubUrl,
    isRecord(current)
      ? { ...current, session: detail.session }
      : { session: detail.session },
  );
}
