"use client";

import { WorkoutsNavSection } from "@/components/workout/workouts-nav-section";

export function ProgressScreenLinks() {
  return (
    <WorkoutsNavSection
      items={["review", "food", "muscles", "history"]}
      foodHistoryHref="/today/history"
    />
  );
}
