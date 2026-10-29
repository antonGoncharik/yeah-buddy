"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import {
  completeSetOverrides,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { writeJson } from "@/lib/api-cache";
import { queueMutate } from "@/lib/offline-mutate";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, SessionFeel } from "@/lib/types";
import { parseWorkoutSession } from "@/lib/workout/map-rows";
import {
  sessionFailAction,
  sessionLoadErrorMessage,
} from "@/lib/workout/session-action-errors";
import { writeCompletedSessionCaches } from "@/lib/workout/session-cache-write";
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
import { sessionDateUrl } from "@/lib/workout/session-urls";

export function useSessionCompleteActions({
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
}: {
  detailRef: RefObject<SessionDetail | null>;
  completing: RefObject<boolean>;
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
      sessionFailAction((message) => setError(message), caught);
      return;
    }

    completing.current = true;
    setBusy(true);
    const draftSnapshot = readSessionDraft(current.session.id);
    const local = completeSessionLocally(current, body);
    const previous = current;
    writeCompletedSessionCaches(current.session.id, local);
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
      writeCompletedSessionCaches(current.session.id, previous);
      applyDetail(previous);
      setError(sessionLoadErrorMessage(caught));
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
    writeCompletedSessionCaches(current.session.id, optimistic);

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
      writeCompletedSessionCaches(current.session.id, merged);
      applyDetail(merged);
      await loadFollowUp(current.session.session_date);
    } catch (caught) {
      haptic("error");
      const reverted = {
        ...optimistic,
        session: { ...optimistic.session, feel: previous },
      };
      writeCompletedSessionCaches(current.session.id, reverted);
      setDetail(reverted);
      setError(sessionLoadErrorMessage(caught));
    }
  }

  return { complete, saveFeel };
}
