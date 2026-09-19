import { ApiError } from "@/lib/api-cache";
import {
  readCachedDay,
  targetsFromCache,
  writeCachedDay,
} from "@/lib/day/cache";
import { withDayType } from "@/lib/day/optimistic";
import { queueMutate } from "@/lib/offline-mutate";
import type { WorkoutSession } from "@/lib/types";
import { templateCanPlan } from "@/lib/workout/hints";
import { readTodaySession } from "@/lib/workout/hub-payload";
import {
  peekWorkoutTemplate,
  sessionDateUrl,
  sessionDetailFromTemplate,
  sessionDetailUrl,
  writeLocalSession,
} from "@/lib/workout/session-local";

export async function queueCreateSession(input: {
  date: string;
  templateId: string;
}): Promise<{ session: WorkoutSession; queued: boolean } | null> {
  const template = peekWorkoutTemplate(input.templateId, input.date);
  if (!template || !templateCanPlan(template)) {
    return null;
  }

  const local = sessionDetailFromTemplate({
    date: input.date,
    template,
  });
  const data = await queueMutate({
    method: "POST",
    url: "/api/sessions",
    body: {
      session_date: input.date,
      template_id: input.templateId,
    },
    cacheUrls: [sessionDetailUrl(local.session.id), sessionDateUrl(input.date)],
    clientIds: [local.session.id],
  });

  if (data != null) {
    const created = readTodaySession(data);
    if (created) {
      markCachedDayTraining(input.date);
      return { session: created, queued: false };
    }
    return null;
  }

  writeLocalSession(local);
  markCachedDayTraining(input.date);
  return { session: local.session, queued: true };
}

export function isEmptyTemplateError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400;
}

function markCachedDayTraining(date: string): void {
  const day = readCachedDay(date);
  if (!day || day.is_training_day) {
    return;
  }
  writeCachedDay(
    date,
    withDayType(day, "training", targetsFromCache("training")),
  );
}
