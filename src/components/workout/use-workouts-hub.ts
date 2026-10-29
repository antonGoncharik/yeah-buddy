"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useDayMood } from "@/components/layout/day-mood";
import { useHubQueueOptimistic } from "@/components/workout/use-hub-queue-optimistic";
import {
  type HubCreateTarget,
  useHubSessionActions,
} from "@/components/workout/use-hub-session-actions";
import { useHubSessionPayload } from "@/components/workout/use-hub-session-payload";
import { useWorkoutsHubCatalog } from "@/components/workout/use-workouts-hub-catalog";
import { phaseEndHint, templateCanPlan } from "@/lib/workout/hints";
import { hubSessionActionLabel } from "@/lib/workout/hub-view";

export type WorkoutsHubModel = ReturnType<typeof useWorkoutsHub>;

export function useWorkoutsHub() {
  const date = format(new Date(), "yyyy-MM-dd");
  const { setMood } = useDayMood();
  const [creating, setCreating] = useState<HubCreateTarget | null>(null);
  const [skipping, setSkipping] = useState(false);

  const { hub, setHub, sessionUrl, applySessionPayload, refreshSessions } =
    useHubSessionPayload(date);

  const catalog = useWorkoutsHubCatalog({
    sessionUrl,
    applySessionPayload,
  });

  const { applySkipOptimistic, applyUnskipOptimistic } = useHubQueueOptimistic(
    date,
    catalog.activeTemplates,
    setHub,
  );

  useEffect(() => {
    if (catalog.loading) {
      return;
    }
    setMood(
      catalog.macro?.phase?.phase_type === "deload" ? "deload" : "training",
    );
    return () => setMood(null);
  }, [catalog.loading, catalog.macro?.phase?.phase_type, setMood]);

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
    templates: catalog.templates,
    session,
    nextTemplate,
    load: catalog.load,
    refreshSessions,
    applySkipOptimistic,
    applyUnskipOptimistic,
    setCreating,
    setSkipping,
    setError: catalog.setError,
  });

  const todayLabel = format(new Date(), "d MMMM", { locale: ru });

  return {
    date,
    todayLabel,
    loading: catalog.loading,
    error: catalog.error,
    load: catalog.load,
    exercises: catalog.exercises,
    activeTemplates: catalog.activeTemplates,
    macro: catalog.macro,
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
    muscleRecoveryHint: catalog.muscleRecoveryHint,
  };
}
