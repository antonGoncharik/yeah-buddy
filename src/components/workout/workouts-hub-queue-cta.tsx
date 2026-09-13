"use client";

import { Button } from "@/components/ui/button";
import type {
  Exercise,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";

export function WorkoutsHubQueueCta({
  session,
  nextTemplate,
  followingTemplate,
  nextCanStart,
  nextMissingMaxes,
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
  nextCanStart: boolean;
  nextMissingMaxes: Exercise[];
  creating: boolean;
  skipping: boolean;
  canUnskip: boolean;
  canBackfillYesterday: boolean;
  onStart: () => void;
  onSkip: (following: WorkoutTemplateDetail) => void;
  onUnskip: () => void;
  onBackfill: () => void;
}) {
  const busy = creating || skipping;
  const canSkip =
    followingTemplate != null &&
    nextTemplate != null &&
    followingTemplate.id !== nextTemplate.id;

  return (
    <>
      {!session && nextTemplate ? (
        <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Сегодня</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
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
            {nextCanStart && nextMissingMaxes.length > 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {missingMaxesHint(nextMissingMaxes)}
              </p>
            ) : null}
            {!nextCanStart ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                В этой тренировке нет упражнений с планом подходов. Добавь их в
                очереди.
              </p>
            ) : null}
          </div>
          {nextCanStart ? (
            <Button
              type="button"
              className="h-14 text-lg"
              disabled={busy}
              onClick={onStart}
            >
              Начать
            </Button>
          ) : null}
          {canUnskip ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={busy}
              onClick={onUnskip}
            >
              Вернуть пропущенную
            </Button>
          ) : canSkip ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={busy}
              onClick={() => onSkip(followingTemplate)}
            >
              Пропустить, дальше {followingTemplate.name}
            </Button>
          ) : null}
          {canBackfillYesterday && nextCanStart ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={busy}
              onClick={onBackfill}
            >
              Записать вчера
            </Button>
          ) : null}
        </section>
      ) : null}

      {session && nextTemplate && canBackfillYesterday && nextCanStart ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base text-muted-foreground"
          disabled={busy}
          onClick={onBackfill}
        >
          Записать вчера
        </Button>
      ) : null}
    </>
  );
}

function missingMaxesHint(exercises: Exercise[]): string {
  const names = exercises
    .slice(0, 3)
    .map((exercise) => exerciseShortLabel(exercise.short_name, exercise.name))
    .join(", ");
  const rest = exercises.length - 3;
  const list = rest > 0 ? `${names} и ещё ${rest}` : names;
  return exercises.length === 1
    ? `Рабочий вес для «${list}» спросим в самой тренировке.`
    : `Рабочие веса для ${list} спросим в самой тренировке.`;
}
