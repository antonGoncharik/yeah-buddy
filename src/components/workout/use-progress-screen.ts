"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { StrengthProgress } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseStrengthProgress } from "@/lib/workout/map-rows";

export type ProgressFilter = "all" | "base" | "isolation";

export function useProgressScreen() {
  const [progress, setProgress] = useState<StrengthProgress | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        "/api/progress",
        (data) => {
          const next = parseStrengthProgress(data);
          if (!next) {
            return false;
          }
          setProgress(next);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setProgress(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  // Exercises without a single recorded weight have nothing to chart; they
  // live in «Упражнения», not here.
  const tracked = useMemo(
    () =>
      (progress?.exercises ?? []).filter(
        (item) => item.current_weight != null || item.points.length > 0,
      ),
    [progress],
  );
  const mixedCategories = useMemo(
    () =>
      tracked.some((item) => item.category === "isolation") &&
      tracked.some((item) => item.category !== "isolation"),
    [tracked],
  );

  const visible = useMemo(() => {
    if (filter === "all" || !mixedCategories) {
      return tracked;
    }
    if (filter === "isolation") {
      return tracked.filter((item) => item.category === "isolation");
    }
    return tracked.filter((item) => item.category !== "isolation");
  }, [filter, mixedCategories, tracked]);

  return {
    progress,
    loading,
    error,
    load,
    filter,
    setFilter,
    openId,
    setOpenId,
    tracked,
    mixedCategories,
    visible,
  };
}
