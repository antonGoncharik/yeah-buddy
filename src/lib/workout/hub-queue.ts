import { peekJson, writeJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import type { WorkoutTemplateDetail } from "@/lib/types";
import type { HubSessionState } from "@/lib/workout/hub-payload";
import { pickNextTemplate, templateAfter } from "@/lib/workout/rotation";
import { sessionDateUrl } from "@/lib/workout/session-local";

export type HubQueueSkipPatch = Pick<
  HubSessionState,
  "skipTemplateIds" | "nextTemplate" | "followingTemplate" | "canUnskip"
>;

export function applyHubQueueSkipPatch(
  date: string,
  activeTemplates: WorkoutTemplateDetail[],
  queueLastTemplateId: string | null,
  newSkip: string[],
): HubQueueSkipPatch {
  const { nextTemplate, followingTemplate } = recomputeHubQueue(
    activeTemplates,
    newSkip,
    queueLastTemplateId,
  );
  writeHubQueuePreview(date, {
    next_template: nextTemplate,
    following_template: followingTemplate,
    can_unskip: newSkip.length > 0,
    skip_template_ids: newSkip,
  });
  return {
    skipTemplateIds: newSkip,
    nextTemplate,
    followingTemplate,
    canUnskip: newSkip.length > 0,
  };
}

export function recomputeHubQueue<T extends { id: string }>(
  active: T[],
  skipTemplateIds: readonly string[],
  lastTemplateId: string | null,
): {
  nextTemplate: T | null;
  followingTemplate: T | null;
} {
  const nextTemplate = pickNextTemplate(
    active,
    skipTemplateIds,
    lastTemplateId,
  );
  const followingRaw =
    nextTemplate && active.length > 1
      ? templateAfter(active, nextTemplate.id)
      : null;
  const followingTemplate =
    followingRaw && followingRaw.id !== nextTemplate?.id ? followingRaw : null;
  return { nextTemplate, followingTemplate };
}

export function writeHubQueuePreview(
  date: string,
  patch: {
    next_template: WorkoutTemplateDetail | null;
    following_template: WorkoutTemplateDetail | null;
    can_unskip: boolean;
    skip_template_ids: string[];
  },
): void {
  const url = sessionDateUrl(date);
  const current = peekJson(url);
  if (!isRecord(current)) {
    return;
  }
  writeJson(url, { ...current, ...patch });
}
