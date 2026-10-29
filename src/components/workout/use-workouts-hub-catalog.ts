"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cachedGetOk } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import {
  readExercises,
  readMacro,
  readTemplates,
} from "@/lib/workout/hub-payload";
import { muscleHubRecoveryHint } from "@/lib/workout/muscle-insights";
import { parseMuscleSnapshot } from "@/lib/workout/parse-muscles";
import { activeWorkoutTemplates } from "@/lib/workout/template-list";

export function useWorkoutsHubCatalog({
  sessionUrl,
  applySessionPayload,
}: {
  sessionUrl: string;
  applySessionPayload: (data: unknown) => boolean;
}) {
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [macro, setMacro] = useState<CurrentMacroState | null>(null);
  const [muscleRecoveryHint, setMuscleRecoveryHint] = useState<string | null>(
    null,
  );
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => activeWorkoutTemplates(templates),
    [templates],
  );

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

  return {
    loading,
    error,
    load,
    setError,
    exercises,
    templates,
    macro,
    muscleRecoveryHint,
    activeTemplates,
  };
}
