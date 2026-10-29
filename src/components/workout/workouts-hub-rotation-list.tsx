"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  hubQueueHighlight,
  templateExerciseSummary,
} from "@/lib/workout/hub-view";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function WorkoutsHubRotationList({
  session,
  sessionTemplate,
  nextTemplate,
  activeTemplates,
}: {
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  activeTemplates: WorkoutTemplateDetail[];
}) {
  const { highlightId, highlightMark } = hubQueueHighlight(
    session,
    sessionTemplate,
    nextTemplate,
  );

  if (activeTemplates.length > 0) {
    return (
      <section className="flex flex-col gap-2">
        <SectionHeading
          title={QUEUE_LABEL}
          href="/workouts/schedule"
          linkLabel="Настроить"
        />
        <ol className="card-surface divide-y divide-border/70 px-5 py-1">
          {activeTemplates.map((template, index) => {
            const current = highlightId === template.id;
            const summary = templateExerciseSummary(template);

            return (
              <li key={template.id}>
                <div className="flex items-center gap-3 py-2.5">
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
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  if (session) {
    return (
      <Link
        href="/workouts/schedule"
        className="flex items-center gap-1 px-1 text-sm font-medium text-primary"
      >
        <Plus className="size-4" aria-hidden />
        Поставить программу
      </Link>
    );
  }

  return null;
}
