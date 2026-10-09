"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { MuscleBodyView, MuscleId, MuscleSnapshot } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseMuscleSnapshot } from "@/lib/workout/parse-muscles";

export type MuscleHorizon = "7" | "14" | "30" | "90";

export function useMuscleScreen() {
  const [snapshot, setSnapshot] = useState<MuscleSnapshot | null>(null);
  const [horizon, setHorizon] = useState<MuscleHorizon>("14");
  const [view, setView] = useState<MuscleBodyView>("front");
  const [selectedId, setSelectedId] = useState<MuscleId | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);
    const path = `/api/muscles?days=${horizon}`;

    try {
      await cachedGet(
        path,
        (data) => {
          const next = parseMuscleSnapshot(data);
          if (!next) {
            return false;
          }
          setSnapshot(next);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setSnapshot(null);
      done(false);
    }
  }, [begin, done, horizon]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleMuscles = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.muscles.filter((item) => item.view === view);
  }, [snapshot, view]);

  const selected = useMemo(() => {
    if (!snapshot || !selectedId) {
      return null;
    }
    return snapshot.muscles.find((item) => item.id === selectedId) ?? null;
  }, [selectedId, snapshot]);

  const selectedHits = useMemo(() => {
    if (!snapshot || !selectedId) {
      return [];
    }
    return snapshot.hits_by_muscle[selectedId] ?? [];
  }, [selectedId, snapshot]);

  return {
    snapshot,
    loading,
    error,
    load,
    horizon,
    setHorizon,
    view,
    setView,
    selectedId,
    setSelectedId,
    visibleMuscles,
    selected,
    selectedHits,
  };
}
