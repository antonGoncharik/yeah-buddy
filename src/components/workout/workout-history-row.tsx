"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { SessionCloseTrail } from "@/components/workout/session-close-trail";
import { formatIsoDate } from "@/lib/day/format";
import type { RecentWorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function WorkoutHistoryRow({ item }: { item: RecentWorkoutSession }) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const name =
    item.template_name ?? WORKOUT_KIND_LABELS[item.session.workout_type];

  return (
    <Link
      href={`/workouts/sessions/${item.session.id}`}
      className={cn(
        "flex items-center gap-3 transition-colors hover:bg-muted/40",
        compact ? "py-2.5" : "py-3.5",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-base font-medium">{name}</span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatIsoDate(item.session.session_date, "EEE d")}
          </span>
        </span>
        {item.summary || item.close_kind ? (
          <SessionCloseTrail
            summary={item.summary}
            closeKind={item.close_kind}
          />
        ) : item.session.status !== "completed" ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {SESSION_STATUS_LABELS[item.session.status]}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
