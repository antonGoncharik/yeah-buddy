"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatIsoDate } from "@/lib/day/format";
import type { RecentWorkoutSession } from "@/lib/types";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function WorkoutHistoryRow({ item }: { item: RecentWorkoutSession }) {
  return (
    <Link
      href={`/workouts/sessions/${item.session.id}`}
      className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium">
          {item.template_name ?? WORKOUT_KIND_LABELS[item.session.workout_type]}
        </span>
        {item.summary ? (
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {item.summary}
          </span>
        ) : item.session.status !== "completed" ? (
          <span className="text-sm text-muted-foreground">
            {SESSION_STATUS_LABELS[item.session.status]}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        {formatIsoDate(item.session.session_date, "d MMMM")}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
