"use client";

import { type Dispatch, type SetStateAction, useRef } from "react";

import {
  completeSetOverrides,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { useSessionEdits } from "@/components/workout/use-session-edits";
import { fetchJson, peekJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { queueMutate } from "@/lib/offline-mutate";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, SessionFeel } from "@/lib/types";
import {
  completeSessionLocally,
  preferLiveFeel,
} from "@/lib/workout/session-complete-local";
import { clearSessionDraft } from "@/lib/workout/session-draft-store";
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
    const current = detailRef.current;
    if (!current) {
      return;
    }

    const sentFeel = current.session.feel;
    const body = {
      note: note.trim() === "" ? null : note.trim(),
      feel: sentFeel,
      sets: completeSetOverrides(current, drafts),
    };
    const local = completeSessionLocally(current, body);
    const previous = current;
    writeCompletedCaches(sessionUrl, local);
    clearSessionDraft(current.session.id);
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
      const next =
        feel === parsed.session.feel
          ? parsed
          : { ...parsed, session: { ...parsed.session, feel } };
      writeJson(sessionUrl, next);
      applyDetail(next);
      await loadFollowUp(next.session.session_date);
    } catch (caught) {
      haptic("error");
      writeCompletedCaches(sessionUrl, previous);
      applyDetail(previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function saveFeel(feel: SessionFeel | null) {
    if (!detail) {
      return;
    }

    const previous = detail.session.feel;
    const nextDetail = {
      ...detail,
      session: { ...detail.session, feel },
    };
    setDetail(nextDetail);
    writeCompletedCaches(sessionUrl, nextDetail);

    try {
      const data = await queueMutate({
        method: "PATCH",
        url: `/api/sessions/${detail.session.id}`,
        body: { feel },
        cacheUrls: [sessionUrl, sessionDateUrl(detail.session.session_date)],
      });
      if (data == null || detail.session.status !== "completed" || correcting) {
        return;
      }

      const refreshed = await fetchJson(sessionUrl);
      const parsed = readSessionDetail(refreshed);
      if (parsed) {
        const feelNow = preferLiveFeel(feel, previous, parsed.session.feel);
        const next =
          feelNow === parsed.session.feel
            ? parsed
            : { ...parsed, session: { ...parsed.session, feel: feelNow } };
        if (next !== parsed) {
          writeJson(sessionUrl, next);
        }
        applyDetail(next);
        await loadFollowUp(detail.session.session_date);
      }
    } catch (caught) {
      haptic("error");
      const reverted = {
        ...nextDetail,
        session: { ...nextDetail.session, feel: previous },
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
