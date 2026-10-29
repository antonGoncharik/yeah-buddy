"use client";

import { useCallback, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import {
  EMPTY_HUB_SESSION,
  readHubSessionState,
} from "@/lib/workout/hub-payload";

export function useHubSessionPayload(date: string) {
  const [hub, setHub] = useState(EMPTY_HUB_SESSION);
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

  return { hub, setHub, sessionUrl, applySessionPayload, refreshSessions };
}
