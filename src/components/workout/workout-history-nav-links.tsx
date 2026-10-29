"use client";

import { WorkoutsNavSection } from "@/components/workout/workouts-nav-section";

export function WorkoutHistoryNavLinks() {
  return (
    <WorkoutsNavSection
      items={["review", "food", "progress"]}
      foodHistoryHref="/today/history?from=settings"
    />
  );
}
