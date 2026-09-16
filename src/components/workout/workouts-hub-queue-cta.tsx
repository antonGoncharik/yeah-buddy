"use client";

import { Button } from "@/components/ui/button";
import type {
  Exercise,
  ExerciseWithMax,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function WorkoutsHubQueueCta({
  session,
  nextTemplate,
  followingTemplate,
  exercises,
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
  exercises: ExerciseWithMax[];
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
  const secondary = [
    canUnskip
      ? { key: "unskip", label: "Вернуть пропущенную", onClick: onUnskip }
      : canSkip
        ? {
            key: "skip",
            label: "Пропустить",
            onClick: () => onSkip(followingTemplate),
          }
        : null,
    canBackfillYesterday && nextCanStart
      ? { key: "backfill", label: "Записать вчера", onClick: onBackfill }
      : null,
  ].filter((item) => item != null);

  if (session) {
    if (!nextTemplate || !canBackfillYesterday || !nextCanStart) {
      return null;
    }
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-11 text-base text-muted-foreground"
        disabled={busy}
        onClick={onBackfill}
      >
        Записать вчера
      </Button>
    );
  }

  if (!nextTemplate) {
    return null;
  }

  const maxById = new Map(
    exercises.map((exercise) => [
      exercise.id,
      exercise.current_max?.max_weight ?? 0,
    ]),
  );

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Сегодня</p>
        <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {nextTemplate.name}
        </h2>
        {followingTemplate && followingTemplate.id !== nextTemplate.id ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Потом {followingTemplate.name}
          </p>
        ) : null}
      </div>

      {nextTemplate.exercises.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border/60">
          {nextTemplate.exercises.map((exercise) => {
            const max = maxById.get(exercise.id) ?? 0;
            const planned = exercise.formula_preset !== "none";
            return (
              <li
                key={exercise.id}
                className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-base">
                  {exerciseShortLabel(exercise.short_name, exercise.name)}
                </span>
                <span className="shrink-0 text-base tabular-nums">
                  {planned && max > 0 ? (
                    <>
                      <span className="font-semibold">{formatWeight(max)}</span>
                      <span className="text-sm text-muted-foreground"> кг</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {nextCanStart && nextMissingMaxes.length > 0 ? (
        <p className="text-sm leading-snug text-muted-foreground">
          {nextMissingMaxes.length === 1
            ? "Где прочерк — 1ПМ спросим в тренировке."
            : "Где прочерки — 1ПМ спросим в тренировке."}
        </p>
      ) : null}
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
          Начать
        </Button>
      ) : null}

      {secondary.length > 0 ? (
        <div className="-mb-1 flex gap-2">
          {secondary.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant="ghost"
              className="h-11 flex-1 text-base text-muted-foreground"
              disabled={busy}
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
