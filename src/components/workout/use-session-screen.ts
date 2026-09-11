"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  draftsFromDetail,
  formatSessionDate,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { loadSessionFollowUp } from "@/components/workout/session-follow-up";
import { useSessionActions } from "@/components/workout/use-session-actions";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { SessionDetail } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { phaseLabel, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import { workAbovePlan } from "@/lib/workout/session-format";
import { readSessionDetail } from "@/lib/workout/session-payload";

export function useSessionScreen() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const { loading, begin, done, reset } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openSetIds, setOpenSetIds] = useState<string[]>([]);
  const [warmupOpen, setWarmupOpen] = useState<Record<string, boolean>>({});
  const [workOpen, setWorkOpen] = useState<Record<string, boolean>>({});
  const [nextName, setNextName] = useState<string | null>(null);
  const [phaseHint, setPhaseHint] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [note, setNote] = useState("");
  const [correcting, setCorrecting] = useState(false);

  const sessionUrl = `/api/sessions/${params.id}`;

  const loadFollowUp = useCallback(async (sessionDate: string) => {
    const followUp = await loadSessionFollowUp(sessionDate);
    setNextName(followUp.nextName);
    setPhaseHint(followUp.phaseHint);
  }, []);

  const applyDetail = useCallback((next: SessionDetail) => {
    setDetail(next);
    setDrafts(draftsFromDetail(next));
    setNote(next.session.note ?? "");
    setOpenSetIds([]);
  }, []);

  const load = useCallback(async () => {
    begin();
    setError(null);

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
            void loadFollowUp(next.session.session_date);
          } else {
            setNextName(null);
            setPhaseHint(null);
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
  }, [applyDetail, begin, done, loadFollowUp, sessionUrl]);

  useEffect(() => {
    if (params.id.length > 0) {
      reset();
    }
  }, [params.id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  const abovePlan = useMemo(() => {
    if (detail?.session.status !== "completed") {
      return false;
    }
    return detail.exercises.some((item) =>
      item.sets.some((set) => workAbovePlan(set)),
    );
  }, [detail]);

  const { complete, saveNote, removeExercise, cancelToday } = useSessionActions(
    {
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
    },
  );

  const session = detail?.session;
  const title =
    detail?.template?.name ??
    (session ? WORKOUT_KIND_LABELS[session.workout_type] : "Тренировка");
  const subtitle = session
    ? [
        formatSessionDate(session.session_date),
        detail?.phase
          ? phaseLabel(detail.phase.phase_type, detail.phase.name)
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
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
    title,
    subtitle,
    showStickyComplete,
    canEditSets,
    busy,
    note,
    setNote,
    saveNote,
    complete,
    cancelToday,
    correcting,
    setCorrecting,
    abovePlan,
    nextName,
    phaseHint,
    openSetIds,
    setOpenSetIds,
    warmupOpen,
    setWarmupOpen,
    workOpen,
    setWorkOpen,
    drafts,
    setDrafts,
    removeExercise,
  };
}
