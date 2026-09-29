"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { DumbbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
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

  return (
    <Link
      href={`/workouts/sessions/${item.session.id}`}
      className={cn(
        "card-surface flex items-center gap-3 px-5 transition-colors hover:bg-muted/40",
        compact ? "py-3" : "py-4",
      )}
    >
      <MarkBadge className={cn("rounded-xl", compact ? "size-8" : "size-9")}>
        <DumbbellDoodle />
      </MarkBadge>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium">
          {item.template_name ?? WORKOUT_KIND_LABELS[item.session.workout_type]}
        </span>
        {item.summary || item.close_kind ? (
          <SessionCloseTrail
            summary={item.summary}
            closeKind={item.close_kind}
          />
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
