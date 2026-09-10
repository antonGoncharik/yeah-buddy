"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { cachedGet, mutateJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  PhaseCircleProgress,
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import {
  phaseEndHint,
  templateHasPlanMaxes,
  todayWeightsHint,
} from "@/lib/workout/hints";
import {
  isRestFoodDay,
  readExercises,
  readHubSessionState,
  readMacro,
  readTemplates,
  readTodaySession,
} from "@/lib/workout/hub-payload";
import { SESSION_STATUS_LABELS } from "@/lib/workout/labels";

export function useWorkoutsHub() {
  const router = useRouter();
  const confirm = useConfirm();
  const date = format(new Date(), "yyyy-MM-dd");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [macro, setMacro] = useState<CurrentMacroState | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionTemplate, setSessionTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [nextTemplate, setNextTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [followingTemplate, setFollowingTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [unfinished, setUnfinished] = useState<RecentWorkoutSession[]>([]);
  const [recent, setRecent] = useState<RecentWorkoutSession[]>([]);
  const [phaseCircle, setPhaseCircle] = useState<PhaseCircleProgress | null>(
    null,
  );
  const [canUnskip, setCanUnskip] = useState(false);
  const [canBackfillYesterday, setCanBackfillYesterday] = useState(false);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const load = useCallback(async () => {
    begin();
    setError(null);
    const sessionUrl = `/api/sessions?date=${encodeURIComponent(date)}`;
    const showCached = () => done(true);

    const results = await Promise.all([
      cachedGet(
        "/api/exercises?filter=active",
        (data) => {
          setExercises(readExercises(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        "/api/templates",
        (data) => {
          setTemplates(readTemplates(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        "/api/macros",
        (data) => {
          setMacro(readMacro(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        sessionUrl,
        (data) => {
          const hub = readHubSessionState(data);
          setSession(hub.session);
          setSessionTemplate(hub.sessionTemplate);
          setNextTemplate(hub.nextTemplate);
          setFollowingTemplate(hub.followingTemplate);
          setUnfinished(hub.unfinished);
          setRecent(hub.recent);
          setPhaseCircle(hub.phaseCircle);
          setCanUnskip(hub.canUnskip);
          setCanBackfillYesterday(hub.canBackfillYesterday);
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
    ]);

    if (!results.some((ok) => ok)) {
      setError(LOAD_FAILED);
      done(false);
      return;
    }

    done(true);
  }, [begin, date, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOnDate(templateId: string, sessionDate: string) {
    const template = templates.find((item) => item.id === templateId);
    if (template && !templateHasPlanMaxes(template, exercises)) {
      router.push("/workouts/exercises");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let dayData: unknown = null;
      try {
        dayData = await mutateJson(
          `/api/days?date=${encodeURIComponent(sessionDate)}`,
        );
      } catch {
        dayData = null;
      }
      if (dayData && isRestFoodDay(dayData)) {
        const ok = await confirm({
          message:
            sessionDate === date
              ? "Этот день уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется."
              : "За этот день еда уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется.",
          confirmLabel: "Сделать тренировочным",
          cancelLabel: "Отмена",
        });
        if (!ok) {
          return;
        }
      }

      const data = await postJson("/api/sessions", {
        session_date: sessionDate,
        template_id: templateId,
      });

      const created = readTodaySession(data);
      if (created) {
        router.push(`/workouts/sessions/${created.id}`);
        return;
      }

      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setCreating(false);
    }
  }

  async function skipTemplate(templateId: string) {
    setSkipping(true);
    setError(null);

    try {
      await postJson("/api/rotation/skip", { template_id: templateId });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSkipping(false);
    }
  }

  async function unskipLast() {
    setSkipping(true);
    setError(null);

    try {
      await mutateJson("/api/rotation/unskip", { method: "POST" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSkipping(false);
    }
  }

  async function pickTemplate(template: WorkoutTemplateDetail) {
    if (session) {
      return;
    }

    if (nextTemplate && template.id !== nextTemplate.id) {
      const ok = await confirm({
        message: `Начать «${template.name}» вместо «${nextTemplate.name}»?`,
        confirmLabel: "Начать",
        cancelLabel: "Оставить",
      });
      if (!ok) {
        return;
      }
    }

    void createOnDate(template.id, date);
  }

  const todayLabel = format(new Date(), "d MMMM", { locale: ru });
  const sessionAction =
    session?.status === "completed"
      ? "Открыть"
      : session?.status === "skipped"
        ? SESSION_STATUS_LABELS.skipped
        : "Открыть";
  const phaseHint = phaseCircle ? phaseEndHint(phaseCircle) : null;
  const weightsHint = todayWeightsHint(
    macro?.phase?.phase_type ?? null,
    macro?.macro?.number ?? null,
    macro?.phase?.name,
  );
  const nextHasPlanMaxes =
    nextTemplate != null && templateHasPlanMaxes(nextTemplate, exercises);

  return {
    date,
    todayLabel,
    loading,
    error,
    load,
    exercises,
    activeTemplates,
    macro,
    session,
    sessionTemplate,
    nextTemplate,
    followingTemplate,
    unfinished,
    recent,
    phaseCircle,
    canUnskip,
    canBackfillYesterday,
    creating,
    skipping,
    sessionAction,
    phaseHint,
    weightsHint,
    nextHasPlanMaxes,
    createOnDate,
    skipTemplate,
    unskipLast,
    pickTemplate,
  };
}

export function formatSessionDay(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
