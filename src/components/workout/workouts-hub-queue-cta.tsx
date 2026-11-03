"use client";

import Link from "next/link";

import { DumbbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { Button } from "@/components/ui/button";
import type { HubCreateTarget } from "@/components/workout/use-hub-session-actions";
import { WorkoutsHubNextTemplatePreview } from "@/components/workout/workouts-hub-next-template-preview";
import { WorkoutsHubQueueSecondaryButtons } from "@/components/workout/workouts-hub-queue-secondary-buttons";
import type {
  ExerciseWithMax,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { hubQueueSecondaryActions } from "@/lib/workout/hub-view";
import { workoutTemplateSessionLine } from "@/lib/workout/session-preview";

export function WorkoutsHubQueueCta({
  session,
  nextTemplate,
  followingTemplate,
  exercises,
  nextCanStart,
  creating,
  skipping,
  canUnskip,
  canBackfillYesterday,
  onStart,
  onSkip,
  onUnskip,
  onBackfill,
  laterNames = [],
  phaseKey = null,
}: {
  session: WorkoutSession | null;
  nextTemplate: WorkoutTemplateDetail | null;
  followingTemplate: WorkoutTemplateDetail | null;
  exercises: ExerciseWithMax[];
  phaseKey?: string | null;
  nextCanStart: boolean;
  creating: HubCreateTarget | null;
  skipping: boolean;
  canUnskip: boolean;
  canBackfillYesterday: boolean;
  onStart: () => void;
  onSkip: (following: WorkoutTemplateDetail) => void;
  onUnskip: () => void;
  onBackfill: () => void;
  laterNames?: string[];
}) {
  const busy = creating != null || skipping;
  const startLabel = creating === "today" ? "Открываю…" : "Начать";
  const backfillLabel =
    creating === "yesterday" ? "Записываю…" : "Записать вчера";
  const canSkip =
    followingTemplate != null &&
    nextTemplate != null &&
    followingTemplate.id !== nextTemplate.id;
  const secondary = hubQueueSecondaryActions({
    canUnskip,
    canSkip,
    canBackfill: canBackfillYesterday && nextCanStart,
    skipping,
    backfillLabel,
    onUnskip,
    onSkip: () => {
      if (followingTemplate) {
        onSkip(followingTemplate);
      }
    },
    onBackfill,
  });

  if (session) {
    if (!nextTemplate || !canBackfillYesterday || !nextCanStart) {
      return null;
    }
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full max-w-full text-base text-muted-foreground"
        disabled={busy}
        onClick={onBackfill}
      >
        {backfillLabel}
      </Button>
    );
  }

  if (!nextTemplate) {
    return null;
  }

  const outlineLine = workoutTemplateSessionLine(nextTemplate);

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <div className="flex items-start gap-3">
        <MarkBadge>
          <DumbbellDoodle />
        </MarkBadge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Сегодня</p>
          <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {nextTemplate.name}
          </h2>
          {outlineLine ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {outlineLine}
            </p>
          ) : null}
        </div>
      </div>

      <WorkoutsHubNextTemplatePreview
        template={nextTemplate}
        exercises={exercises}
        phaseKey={phaseKey}
      />

      {!nextCanStart ? (
        <p className="text-sm leading-snug text-muted-foreground">
          В этой тренировке нет упражнений с планом подходов. Добавь их в
          программе.
        </p>
      ) : null}

      {nextCanStart ? (
        <Button
          type="button"
          className="h-14 text-lg"
          disabled={busy}
          onClick={onStart}
        >
          {startLabel}
        </Button>
      ) : null}

      <WorkoutsHubQueueSecondaryButtons actions={secondary} busy={busy} />

      {laterNames.length > 0 ? (
        <div className="flex flex-col gap-1">
          {laterNames.map((name, index) => (
            <p key={name} className="text-sm text-muted-foreground">
              {index === 0 ? "Потом" : "Дальше"} {name}
            </p>
          ))}
        </div>
      ) : null}

      <Link
        href="/workouts/schedule"
        className="text-base font-medium text-foreground"
      >
        Изменить программу
      </Link>
    </section>
  );
}
