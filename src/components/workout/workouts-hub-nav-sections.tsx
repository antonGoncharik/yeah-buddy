"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { NavRow } from "@/components/layout/nav-row";
import { SectionHeading } from "@/components/layout/section-heading";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import { reviewHref } from "@/lib/ai/review-nav";
import type {
  CurrentMacroState,
  PhaseCircleProgress,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { cycleTimeline, phaseLinkLabel } from "@/lib/workout/hints";
import {
  CYCLE_LABEL,
  exerciseShortLabel,
  FORMULAS_LABEL,
  QUEUE_LABEL,
  REVIEW_LABEL,
} from "@/lib/workout/labels";

export function WorkoutsHubNavSections({
  macro,
  session,
  sessionTemplate,
  nextTemplate,
  phaseCircle,
  phaseHint,
  activeTemplates,
  creating,
  skipping,
  onPickTemplate,
}: {
  macro: CurrentMacroState | null;
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  phaseCircle: PhaseCircleProgress | null;
  phaseHint: string | null;
  activeTemplates: WorkoutTemplateDetail[];
  creating: boolean;
  skipping: boolean;
  onPickTemplate: (template: WorkoutTemplateDetail) => void;
}) {
  const highlightId =
    session?.status === "planned" ? sessionTemplate?.id : nextTemplate?.id;
  const highlightMark = session?.status === "planned" ? "идёт" : "дальше";

  return (
    <div
      className="animate-rise flex flex-col gap-6"
      style={{ animationDelay: "40ms" }}
    >
      {macro?.macro && macro.phase ? (
        <Link
          href="/workouts/macro"
          className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {CYCLE_LABEL}
            </p>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>
          <p className="text-xl font-semibold tracking-tight">
            {phaseLinkLabel(
              macro.macro.number,
              phaseCircle ?? macro.phase_circle,
              macro.phase.phase_type,
              macro.phase.name,
            )}
          </p>
          {macro.planned_cycle.length > 0 ? (
            <CycleTimeline
              steps={cycleTimeline(
                macro.planned_cycle,
                macro.phase.phase_type,
                macro.phase.name,
              )}
            />
          ) : null}
          {phaseHint ? (
            <p className="text-base leading-snug">{phaseHint}</p>
          ) : null}
        </Link>
      ) : macro && macro.planned_cycle.length > 0 ? (
        <Link
          href="/workouts/macro"
          className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {CYCLE_LABEL}
            </p>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </div>
          <p className="text-xl font-semibold tracking-tight">
            Ещё не запущены
          </p>
          <p className="text-base leading-snug text-muted-foreground">
            {macro.planned_cycle.map((phase) => phase.name).join(" → ")}. Те же
            дни, другой вес по кругу.
          </p>
        </Link>
      ) : null}

      {activeTemplates.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeading
            title={QUEUE_LABEL}
            href="/workouts/schedule"
            linkLabel="Настроить"
          />
          <ol className="card-surface divide-y divide-border/70 px-5 py-1">
            {activeTemplates.map((template, index) => {
              const current = highlightId === template.id;
              const summary = template.exercises
                .map((exercise) =>
                  exerciseShortLabel(exercise.short_name, exercise.name),
                )
                .join(" · ");
              const body = (
                <>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "truncate text-base",
                          current ? "font-semibold" : "font-medium",
                        )}
                      >
                        {template.name}
                      </span>
                      {current ? (
                        <span className="shrink-0 text-sm font-medium text-primary">
                          {highlightMark}
                        </span>
                      ) : null}
                    </span>
                    {summary ? (
                      <span className="block truncate text-sm text-muted-foreground">
                        {summary}
                      </span>
                    ) : null}
                  </span>
                </>
              );

              return (
                <li key={template.id}>
                  {session ? (
                    <div className="flex items-center gap-3 py-2.5">{body}</div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
                      disabled={creating || skipping}
                      onClick={() => onPickTemplate(template)}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ) : session ? (
        <Link
          href="/workouts/schedule"
          className="flex items-center gap-1 px-1 text-sm font-medium text-primary"
        >
          <Plus className="size-4" aria-hidden />
          Поставить программу
        </Link>
      ) : null}

      <section className="card-surface divide-y divide-border/70 px-5 py-2">
        <NavRow
          href="/workouts/exercises"
          title="Упражнения"
          hint="1ПМ и рабочий кг"
        />
        <NavRow
          href="/workouts/progress"
          title="Рабочие веса"
          hint="За 90 дней и с первой записи"
        />
        <NavRow
          href="/settings/formulas"
          title={FORMULAS_LABEL}
          hint="Общая схема, если в дне нет своей"
        />
        <NavRow
          href={reviewHref("workouts")}
          title={REVIEW_LABEL}
          hint="За 14 или 30 дней"
        />
      </section>
    </div>
  );
}
