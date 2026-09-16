"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { diaryRangeStart } from "@/lib/diary-range";
import { LOAD_FAILED } from "@/lib/messages";
import type { StrengthProgress } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseStrengthProgress } from "@/lib/workout/map-rows";
import {
  type ProgressHorizon,
  viewedProgress,
} from "@/lib/workout/progress-control";

export type ProgressFilter = "all" | "base" | "isolation";

export function useProgressScreen() {
  const today = calendarToday();
  const [progress, setProgress] = useState<StrengthProgress | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [horizon, setHorizon] = useState<ProgressHorizon>("90");
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

  const viewed = useMemo(
    () => (progress ? viewedProgress(progress, today, horizon) : null),
    [horizon, progress, today],
  );
  const horizonStart =
    horizon === "all" ? null : diaryRangeStart(today, Number(horizon));

  // Exercises without a single recorded weight have nothing to chart; they
  // live in «Упражнения», not here.
  const tracked = useMemo(
    () =>
      (viewed?.exercises ?? []).filter(
        (item) => item.current_weight != null || item.points.length > 0,
      ),
    [viewed],
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
    viewed,
    loading,
    error,
    load,
    filter,
    setFilter,
    horizon,
    setHorizon,
    horizonStart,
    today,
    openId,
    setOpenId,
    tracked,
    mixedCategories,
    visible,
  };
}
