"use client";

import { useCallback, useState } from "react";

import {
  EMPTY_SESSION_FOLLOW_UP,
  loadSessionFollowUp,
  type SessionFollowUp,
} from "@/lib/workout/session-follow-up";

export function useSessionFollowUpState() {
  const [followUp, setFollowUp] = useState<SessionFollowUp>(
    EMPTY_SESSION_FOLLOW_UP,
  );

  const applyFollowUp = useCallback(async (sessionDate: string) => {
    setFollowUp(await loadSessionFollowUp(sessionDate));
  }, []);

  const clearFollowUp = useCallback(() => {
    setFollowUp(EMPTY_SESSION_FOLLOW_UP);
  }, []);

  return {
    ...followUp,
    applyFollowUp,
    clearFollowUp,
  };
}
