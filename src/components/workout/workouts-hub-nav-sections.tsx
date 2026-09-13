"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { NavRow } from "@/components/layout/nav-row";
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
          <p className="text-sm font-medium text-muted-foreground">
            {CYCLE_LABEL}
          </p>
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
      ) : null}

      {activeTemplates.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Link
            href="/workouts/schedule"
            className="flex items-center justify-between gap-3 px-1"
          >
            <h2 className="text-lg font-semibold">{QUEUE_LABEL}</h2>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
          <ol className="flex flex-col gap-1 px-1">
            {activeTemplates.map((template, index) => {
              const current = highlightId === template.id;
              const label = `${index + 1}. ${template.name}`;
              if (session) {
                return (
                  <li
                    key={template.id}
                    className={
                      current
                        ? "text-base font-medium"
                        : "text-base text-muted-foreground"
                    }
                  >
                    {label}
                  </li>
                );
              }

              return (
                <li key={template.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full py-1 text-left text-base disabled:opacity-50",
                      current ? "font-medium" : "text-muted-foreground",
                    )}
                    disabled={creating || skipping}
                    onClick={() => onPickTemplate(template)}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : session ? (
        <Link
          href="/workouts/schedule"
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <Plus className="size-4" aria-hidden />
          Поставить программу
        </Link>
      ) : null}

      <section className="card-surface divide-y divide-border/70 px-5 py-2">
        <NavRow
          href="/workouts/progress"
          title="Рабочие веса"
          hint="Как менялись"
        />
        <NavRow
          href="/workouts/exercises"
          title="Упражнения"
          hint="Список и рабочие веса"
        />
        <NavRow
          href="/settings/formulas"
          title={FORMULAS_LABEL}
          hint="Сколько подходов и с каким весом"
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
