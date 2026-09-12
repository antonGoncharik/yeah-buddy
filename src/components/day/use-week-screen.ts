"use client";

import { useCallback, useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { parseWeekPayload, type WeekSnapshot } from "@/lib/day/week";
import { LOAD_FAILED } from "@/lib/messages";
import { useFirstLoad } from "@/lib/use-first-load";

export function useWeekScreen() {
  const [week, setWeek] = useState<WeekSnapshot | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        "/api/days/week",
        (data) => {
          const next = parseWeekPayload(data);
          if (!next) {
            return false;
          }
          setWeek(next);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setWeek(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  return { week, loading, error, load };
}
