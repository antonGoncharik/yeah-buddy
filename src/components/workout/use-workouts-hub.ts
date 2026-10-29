"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDayMood } from "@/components/layout/day-mood";
import {
  type HubCreateTarget,
  useHubSessionActions,
} from "@/components/workout/use-hub-session-actions";
import { cachedGet, cachedGetOk } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { phaseEndHint, templateCanPlan } from "@/lib/workout/hints";
import {
  EMPTY_HUB_SESSION,
  readExercises,
  readHubSessionState,
  readMacro,
  readTemplates,
} from "@/lib/workout/hub-payload";
import { applyHubQueueSkipPatch } from "@/lib/workout/hub-queue";
import { hubSessionActionLabel } from "@/lib/workout/hub-view";
import { muscleHubRecoveryHint } from "@/lib/workout/muscle-insights";
import { parseMuscleSnapshot } from "@/lib/workout/parse-muscles";
import { activeWorkoutTemplates } from "@/lib/workout/template-list";

export type WorkoutsHubModel = ReturnType<typeof useWorkoutsHub>;

export function useWorkoutsHub() {
  const date = format(new Date(), "yyyy-MM-dd");
  const { setMood } = useDayMood();
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [macro, setMacro] = useState<CurrentMacroState | null>(null);
  const [hub, setHub] = useState(EMPTY_HUB_SESSION);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<HubCreateTarget | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [muscleRecoveryHint, setMuscleRecoveryHint] = useState<string | null>(
    null,
  );

  const activeTemplates = useMemo(
    () => activeWorkoutTemplates(templates),
    [templates],
  );

  const sessionUrl = `/api/sessions?date=${encodeURIComponent(date)}`;

  const applySessionPayload = useCallback((data: unknown): boolean => {
    setHub(readHubSessionState(data));
    return true;
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      await cachedGet(sessionUrl, applySessionPayload);
    } catch {
      // keep optimistic state; full reload is available from the error card
    }
  }, [applySessionPayload, sessionUrl]);

  const applySkipOptimistic = useCallback(
    (templateId: string) => {
      setHub((prev) => {
        const newSkip = prev.skipTemplateIds.includes(templateId)
          ? prev.skipTemplateIds
          : [...prev.skipTemplateIds, templateId];
        return {
          ...prev,
          ...applyHubQueueSkipPatch(
            date,
            activeTemplates,
            prev.queueLastTemplateId,
            newSkip,
          ),
        };
      });
    },
    [activeTemplates, date],
  );

  const applyUnskipOptimistic = useCallback(() => {
    setHub((prev) => {
      if (prev.skipTemplateIds.length === 0) {
        return prev;
      }
      const newSkip = prev.skipTemplateIds.slice(0, -1);
      return {
        ...prev,
        ...applyHubQueueSkipPatch(
          date,
          activeTemplates,
          prev.queueLastTemplateId,
          newSkip,
        ),
      };
    });
  }, [activeTemplates, date]);

  const load = useCallback(async () => {
    begin();
    setError(null);
    const showCached = () => done(true);

    const results = await Promise.all([
      cachedGetOk(
        "/api/exercises?filter=active",
        (data) => {
          setExercises(readExercises(data));
          return true;
        },
        showCached,
      ),
      cachedGetOk(
        "/api/templates",
        (data) => {
          setTemplates(readTemplates(data));
          return true;
        },
        showCached,
      ),
      cachedGetOk(
        "/api/macros",
        (data) => {
          setMacro(readMacro(data));
          return true;
        },
        showCached,
      ),
      cachedGetOk(sessionUrl, applySessionPayload, showCached),
      cachedGetOk("/api/workout-settings", () => true, showCached),
      cachedGetOk(
        "/api/muscles?days=14",
        (data) => {
          const snapshot = parseMuscleSnapshot(data);
          setMuscleRecoveryHint(
            snapshot ? muscleHubRecoveryHint(snapshot.muscles) : null,
          );
          return true;
        },
        showCached,
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

  const {
    session,
    sessionTemplate,
    nextTemplate,
    followingTemplate,
    unfinished,
    recent,
    phaseCircle,
    canUnskip,
    canBackfillYesterday,
  } = hub;

  const { createOnDate, unskipLast, skipNext } = useHubSessionActions({
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
    sessionAction: hubSessionActionLabel(session),
    phaseHint: phaseCircle ? phaseEndHint(phaseCircle) : null,
    nextCanStart: nextTemplate != null && templateCanPlan(nextTemplate),
    createOnDate,
    unskipLast,
    skipNext,
    muscleRecoveryHint,
  };
}
