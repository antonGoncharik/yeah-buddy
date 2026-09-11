"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatSessionDay } from "@/components/workout/use-workouts-hub";
import type {
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
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
  sessionAction: string;
}) {
  return (
    <>
      {unfinished.length > 0 ? (
        <ul className="animate-rise flex flex-col gap-2">
          {unfinished.map((item) => (
            <li key={item.session.id}>
              <Link
                href={`/workouts/sessions/${item.session.id}`}
                className="card-surface flex items-center gap-3 px-5 py-5 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">
                    Не закончена · {formatSessionDay(item.session.session_date)}
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

      {session ? (
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
    </>
  );
}
