"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  draftsFromDetail,
  formatSessionDate,
  parseInteger,
  type SetDraft,
} from "@/components/workout/session-drafts";
import {
  cachedGet,
  deleteJson,
  mutateJson,
  patchJson,
  postJson,
  writeJson,
} from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { phaseEndHint, readPhaseCircle } from "@/lib/workout/hints";
import { readTemplate } from "@/lib/workout/hub-payload";
import { phaseLabel, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import { parseDecimal } from "@/lib/workout/numbers";
import { workAbovePlan } from "@/lib/workout/session-format";
import { readSessionDetail } from "@/lib/workout/session-payload";

export function useSessionScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
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
    try {
      const data = await mutateJson(
        `/api/sessions?date=${encodeURIComponent(sessionDate)}`,
      );
      const nextTemplate = readTemplate(data, "next_template");
      setNextName(nextTemplate?.name ?? null);
      const circle = readPhaseCircle(data);
      setPhaseHint(circle ? phaseEndHint(circle) : null);
    } catch {
      setNextName(null);
      setPhaseHint(null);
    }
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

  async function complete() {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/complete`,
        {
          note: note.trim() === "" ? null : note.trim(),
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

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
        setCorrecting(false);
        haptic("success");
        await loadFollowUp(next.session.session_date);
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!detail) {
      return;
    }

    const trimmed = note.trim() === "" ? null : note.trim();
    if (trimmed === (detail.session.note ?? null)) {
      return;
    }

    try {
      await patchJson(`/api/sessions/${detail.session.id}`, { note: trimmed });
      setDetail((current) =>
        current
          ? { ...current, session: { ...current.session, note: trimmed } }
          : current,
      );
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function removeExercise(sessionExerciseId: string) {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message: "Убрать упражнение из тренировки?",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await deleteJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
      );

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function cancelToday() {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message: "Убрать эту тренировку? Остальные на месте.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await deleteJson(`/api/sessions/${detail.session.id}`);
      haptic("commit");
      router.replace("/workouts");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

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
