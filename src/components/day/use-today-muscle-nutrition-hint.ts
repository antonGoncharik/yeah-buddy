"use client";

import { useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { todayMuscleProteinHint } from "@/lib/workout/muscle-insights";
import { parseMuscleSnapshot } from "@/lib/workout/parse-muscles";

export function useTodayMuscleNutritionHint(input: {
  enabled: boolean;
  remainingProtein: number;
}): string | null {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!input.enabled || input.remainingProtein <= 30) {
      setLine(null);
      return;
    }

    let cancelled = false;
    void cachedGet(
      "/api/muscles?days=14",
      (data) => {
        if (cancelled) {
          return true;
        }
        const snapshot = parseMuscleSnapshot(data);
        setLine(
          snapshot
            ? todayMuscleProteinHint(snapshot, input.remainingProtein)
            : null,
        );
        return true;
      },
      () => {
        if (!cancelled) {
          setLine(null);
        }
      },
    ).catch(() => {
      if (!cancelled) {
        setLine(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [input.enabled, input.remainingProtein]);

  return line;
}
