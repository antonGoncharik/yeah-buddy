"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { formatSessionDay } from "@/components/workout/use-workouts-hub";
import type { RecentWorkoutSession } from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WorkoutsHubRecent({
  recent,
}: {
  recent: RecentWorkoutSession[];
}) {
  if (recent.length === 0) {
    return null;
  }

  return (
    <section
      className="animate-rise flex flex-col gap-2"
      style={{ animationDelay: "80ms" }}
    >
      <SectionHeading
        title="Недавние"
        href="/workouts/history"
        linkLabel="Все"
      />
      <ul className="card-surface divide-y divide-border/70 px-5 py-1">
        {recent.map((item) => (
          <li key={item.session.id}>
            <Link
              href={`/workouts/sessions/${item.session.id}`}
              className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-base font-medium">
                    {item.template_name ??
                      WORKOUT_KIND_LABELS[item.session.workout_type]}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatSessionDay(item.session.session_date)}
                  </span>
                </span>
                {item.summary ? (
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {item.summary}
                  </span>
                ) : null}
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
