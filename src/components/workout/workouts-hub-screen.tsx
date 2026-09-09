"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatSessionDay,
  useWorkoutsHub,
} from "@/components/workout/use-workouts-hub";
import { previousIsoDate } from "@/lib/day/dates";
import {
  WORKOUTS_NEED_EXERCISES,
  WORKOUTS_NEED_MAXES,
  WORKOUTS_NEED_TEMPLATES,
} from "@/lib/messages";
import { cn } from "@/lib/utils";
import { phaseLinkLabel, queueItemMark } from "@/lib/workout/hints";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WorkoutsHubScreen() {
  const {
    date,
    todayLabel,
    loading,
    error,
    load,
    exercises,
    activeTemplates,
    macro,
    session,
    sessionTemplate,
    nextTemplate,
    followingTemplate,
    unfinished,
    recent,
    phaseCircle,
    canUnskip,
    canBackfillYesterday,
    creating,
    skipping,
    sessionAction,
    phaseHint,
    weightsHint,
    nextHasPlanMaxes,
    createOnDate,
    skipTemplate,
    unskipLast,
    pickTemplate,
  } = useWorkoutsHub();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_EXERCISES}</p>
            <Link
              href="/workouts/exercises/new"
              className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
            >
              <Plus className="size-5" aria-hidden />
              Новое упражнение
            </Link>
          </section>
        ) : null}

        {!loading &&
        !error &&
        !session &&
        exercises.length > 0 &&
        !nextTemplate ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_TEMPLATES}</p>
            <Link
              href="/workouts/schedule"
              className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
            >
              <Plus className="size-5" aria-hidden />
              Собрать очередь
            </Link>
          </section>
        ) : null}

        {!loading && !error && unfinished.length > 0 ? (
          <ul className="animate-rise flex flex-col gap-2">
            {unfinished.map((item) => (
              <li key={item.session.id}>
                <Link
                  href={`/workouts/sessions/${item.session.id}`}
                  className="card-surface flex items-center gap-3 px-5 py-5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary">
                      Не закончена ·{" "}
                      {formatSessionDay(item.session.session_date)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                      {item.template_name ??
                        WORKOUT_KIND_LABELS[item.session.workout_type]}
                    </h2>
                    <p className="mt-2 text-base text-muted-foreground">
                      Открыть: доделать или убрать.
                    </p>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && !error && session ? (
          <Link
            href={`/workouts/sessions/${session.id}`}
            className="card-surface animate-rise flex items-center gap-3 px-5 py-6 transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {session.status === "planned" ? "Сегодня в зале" : "Сегодня"}
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {sessionTemplate?.name ??
                  WORKOUT_KIND_LABELS[session.workout_type]}
              </h2>
              <p
                className={
                  session.status === "planned"
                    ? "mt-3 text-base font-medium text-primary"
                    : "mt-3 text-base text-muted-foreground"
                }
              >
                {sessionAction}
              </p>
              {session.status === "completed" && nextTemplate ? (
                <p className="mt-2 text-base text-muted-foreground">
                  Дальше {nextTemplate.name}
                </p>
              ) : null}
              {session.status === "planned" && followingTemplate ? (
                <p className="mt-2 text-base text-muted-foreground">
                  Потом {followingTemplate.name}
                </p>
              ) : null}
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ) : null}

        {!loading && !error && !session && nextTemplate ? (
          <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Сегодня в очереди
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {nextTemplate.name}
              </h2>
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
                onClick={() => void createOnDate(nextTemplate.id, date)}
              >
                Начать
              </Button>
            ) : (
              <Link
                href="/workouts/exercises"
                className={cn(buttonVariants(), "h-14 text-lg")}
              >
                Написать рабочие веса
              </Link>
            )}
            {activeTemplates.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={creating || skipping}
                onClick={() => void skipTemplate(nextTemplate.id)}
              >
                Не это
              </Button>
            ) : null}
            {canUnskip ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={creating || skipping}
                onClick={() => void unskipLast()}
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
                onClick={() =>
                  void createOnDate(nextTemplate.id, previousIsoDate(date))
                }
              >
                Записать вчера
              </Button>
            ) : null}
          </section>
        ) : null}

        {!loading &&
        !error &&
        session &&
        nextTemplate &&
        canBackfillYesterday &&
        nextHasPlanMaxes ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-base text-muted-foreground"
            disabled={creating || skipping}
            onClick={() =>
              void createOnDate(nextTemplate.id, previousIsoDate(date))
            }
          >
            Записать вчера
          </Button>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <div
            className="animate-rise flex flex-col gap-6"
            style={{ animationDelay: "40ms" }}
          >
            {macro?.macro && macro.phase ? (
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-lg font-semibold">Макроцикл</h2>
                  <Link
                    href="/workouts/macro"
                    className="text-sm font-medium text-primary"
                  >
                    Открыть
                  </Link>
                </div>
                <Link
                  href="/workouts/macro"
                  className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <p className="text-xl font-semibold tracking-tight">
                    {phaseLinkLabel(
                      macro.macro.number,
                      phaseCircle ?? macro.phase_circle,
                      macro.phase.phase_type,
                    )}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {session
                      ? "От этой фазы считаются веса сегодня."
                      : "От этой фазы посчитаются веса, когда начнёшь."}
                  </p>
                  {phaseHint ? (
                    <p className="text-base leading-snug">{phaseHint}</p>
                  ) : null}
                  {phaseHint ? (
                    <p className="text-base font-medium text-primary">
                      {phaseCircle?.phase_type === "deload"
                        ? "Можно закрыть макроцикл"
                        : "Можно закрыть фазу"}
                    </p>
                  ) : null}
                </Link>
              </section>
            ) : null}

            {activeTemplates.length > 0 ? (
              <section className="flex flex-col gap-2">
                <Link
                  href="/workouts/schedule"
                  className="flex items-center justify-between gap-3 px-1"
                >
                  <h2 className="text-lg font-semibold">Очередь</h2>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
                <p className="px-1 text-sm leading-relaxed text-muted-foreground">
                  Тренировки идут по кругу, не по дням недели.
                  {session
                    ? null
                    : " Нажми имя, если хочешь начать не следующее."}
                </p>
                <ol className="flex flex-col gap-1 px-1">
                  {activeTemplates.map((template, index) => {
                    const mark = queueItemMark({
                      templateId: template.id,
                      sessionTemplateId: sessionTemplate?.id ?? null,
                      nextTemplateId: nextTemplate?.id ?? null,
                    });
                    const label = `${index + 1}. ${template.name}`;
                    const emphasized = mark !== "";
                    if (session) {
                      return (
                        <li
                          key={template.id}
                          className={
                            emphasized
                              ? "text-base font-medium"
                              : "text-base text-muted-foreground"
                          }
                        >
                          {label}
                          {mark}
                        </li>
                      );
                    }

                    return (
                      <li key={template.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full py-1 text-left text-base disabled:opacity-50",
                            emphasized
                              ? "font-medium"
                              : "text-muted-foreground",
                          )}
                          disabled={creating || skipping}
                          onClick={() => void pickTemplate(template)}
                        >
                          {label}
                          {mark}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : (
              <Link
                href="/workouts/schedule"
                className="flex items-center gap-1 text-sm font-medium text-primary"
              >
                <Plus className="size-4" aria-hidden />
                Собрать очередь
              </Link>
            )}

            <nav className="grid grid-cols-3 gap-2">
              <Link
                href="/workouts/progress"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                Прогресс
              </Link>
              <Link
                href="/workouts/history"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                История
              </Link>
              <Link
                href="/workouts/exercises"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                Упражнения
              </Link>
            </nav>
          </div>
        ) : null}

        {!loading && !error && recent.length > 0 ? (
          <section
            className="animate-rise flex flex-col gap-2 px-1"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              Недавние
            </h2>
            <ul className="flex flex-col gap-1">
              {recent.map((item) => (
                <li key={item.session.id}>
                  <Link
                    href={`/workouts/sessions/${item.session.id}`}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="min-w-0">
                      <span className="truncate text-base">
                        {item.template_name ??
                          WORKOUT_KIND_LABELS[item.session.workout_type]}
                      </span>
                      {item.summary ? (
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {item.summary}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      {formatSessionDay(item.session.session_date)}
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
