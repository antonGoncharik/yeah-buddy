"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { WORKOUTS_NEED_MAXES } from "@/lib/messages";
import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { exerciseShortLabel } from "@/lib/workout/labels";

export function WorkoutsHubQueueCta({
  session,
  nextTemplate,
  followingTemplate,
  activeTemplatesCount,
  nextHasPlanMaxes,
  weightsHint,
  creating,
  skipping,
  canUnskip,
  canBackfillYesterday,
  onStart,
  onSkip,
  onUnskip,
  onBackfill,
}: {
  session: WorkoutSession | null;
  nextTemplate: WorkoutTemplateDetail | null;
  followingTemplate: WorkoutTemplateDetail | null;
  activeTemplatesCount: number;
  nextHasPlanMaxes: boolean;
  weightsHint: string;
  creating: boolean;
  skipping: boolean;
  canUnskip: boolean;
  canBackfillYesterday: boolean;
  onStart: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  onBackfill: () => void;
}) {
  return (
    <>
      {!session && nextTemplate ? (
        <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Сегодня в очереди
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {nextTemplate.name}
            </h2>
            {nextTemplate.exercises.length > 0 ? (
              <p className="mt-2 text-sm leading-snug text-muted-foreground">
                {nextTemplate.exercises
                  .map((exercise) =>
                    exerciseShortLabel(exercise.short_name, exercise.name),
                  )
                  .join(" · ")}
              </p>
            ) : null}
            {followingTemplate ? (
              <p className="mt-2 text-base text-muted-foreground">
                Потом {followingTemplate.name}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {nextHasPlanMaxes ? weightsHint : WORKOUTS_NEED_MAXES}
            </p>
          </div>
          {nextHasPlanMaxes ? (
            <Button
              type="button"
              className="h-14 text-lg"
              disabled={creating || skipping}
              onClick={onStart}
            >
              Начать
            </Button>
          ) : (
            <Link
              href="/workouts/exercises"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Написать веса
            </Link>
          )}
          {activeTemplatesCount > 1 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={creating || skipping}
              onClick={onSkip}
            >
              Другая тренировка
            </Button>
          ) : null}
          {canUnskip ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={creating || skipping}
              onClick={onUnskip}
            >
              Вернуть в очередь
            </Button>
          ) : null}
          {canBackfillYesterday && nextHasPlanMaxes ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={creating || skipping}
              onClick={onBackfill}
            >
              Записать вчера
            </Button>
          ) : null}
        </section>
      ) : null}

      {session && nextTemplate && canBackfillYesterday && nextHasPlanMaxes ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base text-muted-foreground"
          disabled={creating || skipping}
          onClick={onBackfill}
        >
          Записать вчера
        </Button>
      ) : null}
    </>
  );
}
