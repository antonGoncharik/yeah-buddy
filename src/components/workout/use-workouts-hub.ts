"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDayMood } from "@/components/layout/day-mood";
import { useHubSessionActions } from "@/components/workout/use-hub-session-actions";
import { cachedGet } from "@/lib/api-cache";
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
import { phaseEndHint, templateCanPlan } from "@/lib/workout/hints";
import {
  readExercises,
  readHubSessionState,
  readMacro,
  readTemplates,
} from "@/lib/workout/hub-payload";
import { recomputeHubQueue, writeHubQueuePreview } from "@/lib/workout/hub-queue";
import { SESSION_STATUS_LABELS } from "@/lib/workout/labels";

function applyHubState(
  hub: ReturnType<typeof readHubSessionState>,
  setters: {
    setSession: (value: WorkoutSession | null) => void;
    setSessionTemplate: (value: WorkoutTemplateDetail | null) => void;
    setNextTemplate: (value: WorkoutTemplateDetail | null) => void;
    setFollowingTemplate: (value: WorkoutTemplateDetail | null) => void;
    setUnfinished: (value: RecentWorkoutSession[]) => void;
    setRecent: (value: RecentWorkoutSession[]) => void;
    setPhaseCircle: (value: PhaseCircleProgress | null) => void;
    setCanUnskip: (value: boolean) => void;
    setCanBackfillYesterday: (value: boolean) => void;
    setQueueLastTemplateId: (value: string | null) => void;
    setSkipTemplateIds: (value: string[]) => void;
  },
): void {
  setters.setSession(hub.session);
  setters.setSessionTemplate(hub.sessionTemplate);
  setters.setNextTemplate(hub.nextTemplate);
  setters.setFollowingTemplate(hub.followingTemplate);
  setters.setUnfinished(hub.unfinished);
  setters.setRecent(hub.recent);
  setters.setPhaseCircle(hub.phaseCircle);
  setters.setCanUnskip(hub.canUnskip);
  setters.setCanBackfillYesterday(hub.canBackfillYesterday);
  setters.setQueueLastTemplateId(hub.queueLastTemplateId);
  setters.setSkipTemplateIds(hub.skipTemplateIds);
}

export function useWorkoutsHub() {
  const date = format(new Date(), "yyyy-MM-dd");
  const { setMood } = useDayMood();
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
  const [queueLastTemplateId, setQueueLastTemplateId] = useState<string | null>(
    null,
  );
  const [skipTemplateIds, setSkipTemplateIds] = useState<string[]>([]);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const hubSetters = useMemo(
    () => ({
      setSession,
      setSessionTemplate,
      setNextTemplate,
      setFollowingTemplate,
      setUnfinished,
      setRecent,
      setPhaseCircle,
      setCanUnskip,
      setCanBackfillYesterday,
      setQueueLastTemplateId,
      setSkipTemplateIds,
    }),
    [],
  );

  const sessionUrl = `/api/sessions?date=${encodeURIComponent(date)}`;

  const applySessionPayload = useCallback(
    (data: unknown): boolean => {
      const hub = readHubSessionState(data);
      applyHubState(hub, hubSetters);
      return true;
    },
    [hubSetters],
  );

  const refreshSessions = useCallback(async () => {
    try {
      await cachedGet(sessionUrl, applySessionPayload);
    } catch {
      // keep optimistic state; full reload is available from the error card
    }
  }, [applySessionPayload, sessionUrl]);

  const applySkipOptimistic = useCallback(
    (templateId: string) => {
      const newSkip = skipTemplateIds.includes(templateId)
        ? skipTemplateIds
        : [...skipTemplateIds, templateId];
      const { nextTemplate: next, followingTemplate: following } =
        recomputeHubQueue(activeTemplates, newSkip, queueLastTemplateId);
      setSkipTemplateIds(newSkip);
      setNextTemplate(next);
      setFollowingTemplate(following);
      setCanUnskip(newSkip.length > 0);
      writeHubQueuePreview(date, {
        next_template: next,
        following_template: following,
        can_unskip: newSkip.length > 0,
        skip_template_ids: newSkip,
      });
    },
    [activeTemplates, date, queueLastTemplateId, skipTemplateIds],
  );

  const applyUnskipOptimistic = useCallback(() => {
    if (skipTemplateIds.length === 0) {
      return;
    }
    const newSkip = skipTemplateIds.slice(0, -1);
    const { nextTemplate: next, followingTemplate: following } =
      recomputeHubQueue(activeTemplates, newSkip, queueLastTemplateId);
    setSkipTemplateIds(newSkip);
    setNextTemplate(next);
    setFollowingTemplate(following);
    setCanUnskip(newSkip.length > 0);
    writeHubQueuePreview(date, {
      next_template: next,
      following_template: following,
      can_unskip: newSkip.length > 0,
      skip_template_ids: newSkip,
    });
  }, [activeTemplates, date, queueLastTemplateId, skipTemplateIds]);

  const load = useCallback(async () => {
    begin();
    setError(null);
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
      cachedGet(sessionUrl, applySessionPayload, showCached).then(
        () => true,
        () => false,
      ),
      cachedGet("/api/workout-settings", () => true, showCached).then(
        () => true,
        () => false,
      ),
    ]);

    const [, templatesOk, , sessionOk] = results;
    if (!templatesOk || !sessionOk) {
      setError(LOAD_FAILED);
      done(false);
      return;
    }

    done(true);
  }, [applySessionPayload, begin, done, sessionUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) {
      return;
    }
    setMood(macro?.phase?.phase_type === "deload" ? "deload" : "training");
    return () => setMood(null);
  }, [loading, macro?.phase?.phase_type, setMood]);

  const { createOnDate, unskipLast, skipNext, pickTemplate } =
    useHubSessionActions({
      date,
      templates,
      session,
      nextTemplate,
      load,
      refreshSessions,
      applySkipOptimistic,
      applyUnskipOptimistic,
      setCreating,
      setSkipping,
      setError,
    });

  const todayLabel = format(new Date(), "d MMMM", { locale: ru });
  const sessionAction =
    session?.status === "planned"
      ? "Продолжить"
      : session?.status === "skipped"
        ? SESSION_STATUS_LABELS.skipped
        : session?.status === "completed"
          ? "Готово"
          : null;
  const phaseHint = phaseCircle ? phaseEndHint(phaseCircle) : null;
  const nextCanStart = nextTemplate != null && templateCanPlan(nextTemplate);

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
    nextCanStart,
    createOnDate,
    unskipLast,
    skipNext,
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
