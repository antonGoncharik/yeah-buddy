"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/api-cache";
import {
  EMPTY_HUB_SESSION,
  type HubSessionState,
  readHubSessionState,
} from "@/lib/workout/hub-payload";

export function useTodayWorkoutPeek(enabled: boolean, date: string) {
  const [state, setState] = useState<HubSessionState | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState(null);
      return;
    }

    let cancel = false;
    void fetchJson(`/api/sessions?date=${date}`)
      .then((data) => {
        if (!cancel) {
          setState(readHubSessionState(data));
        }
      })
      .catch(() => {
        if (!cancel) {
          setState(EMPTY_HUB_SESSION);
        }
      });

    return () => {
      cancel = true;
    };
  }, [date, enabled]);

  return state;
}
