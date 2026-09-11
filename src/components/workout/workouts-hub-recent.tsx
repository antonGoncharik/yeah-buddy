"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

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
      className="animate-rise flex flex-col gap-2 px-1"
      style={{ animationDelay: "80ms" }}
    >
      <h2 className="text-sm font-medium text-muted-foreground">Недавние</h2>
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
  );
}
