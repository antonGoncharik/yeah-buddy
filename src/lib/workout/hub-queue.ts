import { peekJson, writeJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { pickNextTemplate, templateAfter } from "@/lib/workout/rotation";
import { sessionDateUrl } from "@/lib/workout/session-local";

export function recomputeHubQueue<T extends { id: string }>(
  active: T[],
  skipTemplateIds: readonly string[],
  lastTemplateId: string | null,
): {
  nextTemplate: T | null;
  followingTemplate: T | null;
} {
  const nextTemplate = pickNextTemplate(active, skipTemplateIds, lastTemplateId);
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
