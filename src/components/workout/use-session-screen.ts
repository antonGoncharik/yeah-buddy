"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDayMood } from "@/components/layout/day-mood";
import { useSessionActions } from "@/components/workout/use-session-actions";
import { useSessionEaseWeek } from "@/components/workout/use-session-ease-week";
import { useSessionFollowUpState } from "@/components/workout/use-session-follow-up-state";
import { cachedGet, subscribeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { SessionDetail } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { preferLiveCompleted } from "@/lib/workout/session-complete-local";
import { mergeLiveDrafts } from "@/lib/workout/session-draft-merge";
import {
  clearSessionDraft,
  overlaySessionDrafts,
  readSessionDraft,
  writeSessionDraft,
} from "@/lib/workout/session-draft-store";
import { workAbovePlan } from "@/lib/workout/session-format";
import { readSessionDetail } from "@/lib/workout/session-payload";
import {
  sessionScreenSubtitle,
  sessionScreenTitle,
} from "@/lib/workout/session-screen-view";
import {
  draftsFromDetail,
  type SetDraft,
} from "@/lib/workout/session-set-drafts";

export type SessionScreenModel = ReturnType<typeof useSessionScreen>;

export function useSessionScreen() {
  const params = useParams<{ id: string }>();
  const { setMood } = useDayMood();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const { loading, begin, done, reset } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openSetIds, setOpenSetIds] = useState<string[]>([]);
  const [warmupOpen, setWarmupOpen] = useState<Record<string, boolean>>({});
  const {
    nextName,
    phaseHint,
    holdHint,
    completedSessions,
    lastCompletedBefore,
    phaseCircle,
    phaseId,
    easeWeek,
    easeSessionId,
    applyFollowUp,
    clearFollowUp,
  } = useSessionFollowUpState();
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [note, setNote] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const detailRef = useRef<SessionDetail | null>(null);
  detailRef.current = detail;

  const sessionUrl = `/api/sessions/${params.id}`;

  const applyDetail = useCallback((incoming: SessionDetail) => {
    const previous = detailRef.current;
    const next = preferLiveCompleted(previous, incoming);
    const sessionChanged =
      !previous ||
      previous.session.id !== next.session.id ||
      previous.session.status !== next.session.status;
    setDetail(next);
    const stored =
      next.session.status === "planned"
        ? readSessionDraft(next.session.id)
        : null;
    setDrafts((current) =>
      mergeLiveDrafts(
        previous,
        next,
        overlaySessionDrafts(draftsFromDetail(next), stored?.drafts),
        current,
      ),
    );
    setNote((current) => {
      const samePlanned =
        previous != null &&
        previous.session.id === next.session.id &&
        previous.session.status === "planned" &&
        next.session.status === "planned";
      if (samePlanned && current !== (previous.session.note ?? "")) {
        return current;
      }
      return stored ? stored.note : (next.session.note ?? "");
    });
    if (sessionChanged) {
      setOpenSetIds([]);
    }
  }, []);

  const load = useCallback(async () => {
    begin();
    setError(null);
    clearFollowUp();

    try {
      await cachedGet(
        sessionUrl,
        (data) => {
          const next = readSessionDetail(data);
          if (!next) {
            return false;
          }
          applyDetail(next);
          if (next.session.status === "completed") {
            void applyFollowUp(next.session.session_date);
          } else {
            clearFollowUp();
          }
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setDetail(null);
      done(false);
    }
  }, [applyDetail, applyFollowUp, begin, clearFollowUp, done, sessionUrl]);

  useEffect(() => {
    if (params.id.length > 0) {
      reset();
    }
  }, [params.id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeJson((url, data) => {
      if (url !== sessionUrl) {
        return;
      }
      const next = readSessionDetail(data);
      if (next) {
        applyDetail(next);
      }
    });
  }, [applyDetail, sessionUrl]);

  useEffect(() => {
    setMood(detail?.phase?.phase_type === "deload" ? "deload" : "training");
    return () => setMood(null);
  }, [detail?.phase?.phase_type, setMood]);

  useEffect(() => {
    if (!detail) {
      return;
    }
    if (detail.session.status === "planned" || correcting) {
      writeSessionDraft(detail.session.id, { drafts, note });
      return;
    }
    clearSessionDraft(detail.session.id);
  }, [correcting, detail, drafts, note]);

  const abovePlan = useMemo(() => {
    if (detail?.session.status !== "completed") {
      return false;
    }
    return detail.exercises.some((item) =>
      item.sets.some((set) => workAbovePlan(set)),
    );
  }, [detail]);

  const {
    complete,
    saveFeel,
    raiseMaxes,
    saveNote,
    removeExercise,
    reorderExercises,
    saveMissingMaxes,
    saveMissingTracks,
    markSet,
    addExercise,
    addWorkSet,
    dropWorkSet,
    swapExercise,
    easeSession,
    shortenSession,
    cancelToday,
  } = useSessionActions({
    detail,
    note,
    drafts,
    sessionUrl,
    applyDetail,
    loadFollowUp: applyFollowUp,
    setBusy,
    setError,
    setCorrecting,
    setDetail,
    correcting,
  });

  const { easeWeek: activeEaseWeek, easeWeekNow } = useSessionEaseWeek({
    detail,
    easeWeek,
    easeSessionId,
    setBusy,
    setError,
    onApplied: applyFollowUp,
  });

  const session = detail?.session;
  const showStickyComplete =
    session?.status === "planned" ||
    (session?.status === "completed" && correcting);
  const canEditSets =
    session?.status === "planned" ||
    (session?.status === "completed" && correcting);

  return {
    loading,
    error,
    detail,
    load,
    session,
    title: sessionScreenTitle(detail),
    subtitle: sessionScreenSubtitle(detail, phaseCircle),
    showStickyComplete,
    canEditSets,
    busy,
    note,
    setNote,
    saveNote,
    complete,
    saveFeel,
    raiseMaxes,
    cancelToday,
    correcting,
    setCorrecting,
    abovePlan,
    nextName,
    phaseHint,
    holdHint,
    completedSessions,
    lastCompletedBefore,
    phaseCircle,
    phaseId,
    easeWeek: activeEaseWeek,
    easeWeekNow,
    openSetIds,
    setOpenSetIds,
    warmupOpen,
    setWarmupOpen,
    drafts,
    setDrafts,
    removeExercise,
    reorderExercises,
    saveMissingMaxes,
    saveMissingTracks,
    markSet,
    addExercise,
    addWorkSet,
    dropWorkSet,
    swapExercise,
    easeSession,
    shortenSession,
  };
}
