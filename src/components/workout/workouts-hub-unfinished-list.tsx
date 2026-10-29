"use client";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { WorkoutsHubSessionLink } from "@/components/workout/workouts-hub-session-link";
import type { RecentWorkoutSession } from "@/lib/types";
import { formatWorkDate } from "@/lib/workout/exercise-work-phase";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WorkoutsHubUnfinishedList({
  items,
}: {
  items: RecentWorkoutSession[];
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="animate-rise flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.session.id}>
          <WorkoutsHubSessionLink
            href={`/workouts/sessions/${item.session.id}`}
            compact={compact}
            eyebrow={
              <span className="text-primary">
                Не закончена · {formatWorkDate(item.session.session_date)}
              </span>
            }
            title={
              item.template_name ??
              WORKOUT_KIND_LABELS[item.session.workout_type]
            }
          />
        </li>
      ))}
    </ul>
  );
}
