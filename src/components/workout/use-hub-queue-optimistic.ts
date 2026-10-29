"use client";

import { type Dispatch, type SetStateAction, useCallback } from "react";

import type { WorkoutTemplateDetail } from "@/lib/types";
import type { HubSessionState } from "@/lib/workout/hub-payload";
import { applyHubQueueSkipPatch } from "@/lib/workout/hub-queue";

export function useHubQueueOptimistic(
  date: string,
  activeTemplates: WorkoutTemplateDetail[],
  setHub: Dispatch<SetStateAction<HubSessionState>>,
) {
  const applySkipOptimistic = useCallback(
    (templateId: string) => {
      setHub((prev) => {
        const newSkip = prev.skipTemplateIds.includes(templateId)
          ? prev.skipTemplateIds
          : [...prev.skipTemplateIds, templateId];
        return {
          ...prev,
          ...applyHubQueueSkipPatch(
            date,
            activeTemplates,
            prev.queueLastTemplateId,
            newSkip,
          ),
        };
      });
    },
    [activeTemplates, date, setHub],
  );

  const applyUnskipOptimistic = useCallback(() => {
    setHub((prev) => {
      if (prev.skipTemplateIds.length === 0) {
        return prev;
      }
      const newSkip = prev.skipTemplateIds.slice(0, -1);
      return {
        ...prev,
        ...applyHubQueueSkipPatch(
          date,
          activeTemplates,
          prev.queueLastTemplateId,
          newSkip,
        ),
      };
    });
  }, [activeTemplates, date, setHub]);

  return { applySkipOptimistic, applyUnskipOptimistic };
}
