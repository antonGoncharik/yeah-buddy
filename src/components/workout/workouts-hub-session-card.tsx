"use client";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { WorkoutsHubSessionLink } from "@/components/workout/workouts-hub-session-link";
import { WorkoutsHubUnfinishedList } from "@/components/workout/workouts-hub-unfinished-list";
import type {
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WorkoutsHubSessionCard({
  unfinished,
  session,
  sessionTemplate,
  nextTemplate,
  followingTemplate,
  sessionAction,
}: {
  unfinished: RecentWorkoutSession[];
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  followingTemplate: WorkoutTemplateDetail | null;
  sessionAction: string | null;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  return (
    <>
      <WorkoutsHubUnfinishedList items={unfinished} />

      {session ? (
        <WorkoutsHubSessionLink
          href={`/workouts/sessions/${session.id}`}
          compact={compact}
          className={cn("animate-rise", !compact && "py-5", compact && "py-4")}
          eyebrow={<span className="text-muted-foreground">Сегодня</span>}
          title={
            sessionTemplate?.name ?? WORKOUT_KIND_LABELS[session.workout_type]
          }
          titleClassName="text-2xl"
          footer={
            <>
              {sessionAction ? (
                <p
                  className={
                    session.status === "planned"
                      ? "mt-2 text-base font-medium text-primary"
                      : "mt-2 text-base text-muted-foreground"
                  }
                >
                  {sessionAction}
                </p>
              ) : null}
              {!compact && session.status === "completed" && nextTemplate ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Дальше {nextTemplate.name}
                </p>
              ) : null}
              {!compact && session.status === "planned" && followingTemplate ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Потом {followingTemplate.name}
                </p>
              ) : null}
            </>
          }
        />
      ) : null}
    </>
  );
}
