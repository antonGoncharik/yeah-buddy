"use client";

import {
  BarbellDoodle,
  ChartDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { REVIEW_LABEL, STRENGTH_LABEL } from "@/lib/workout/labels";

export function WorkoutHistoryNavLinks() {
  return (
    <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
      <NavRow
        href="/settings/review"
        title={REVIEW_LABEL}
        hint="За 14, 30 или 90 дней"
        icon={<ChartDoodle />}
      />
      <NavRow
        href="/today/history?from=settings"
        title="История еды"
        hint="БЖУ и вес по дням"
        icon={<MealDayDoodle />}
      />
      <NavRow
        href="/workouts/progress"
        title={STRENGTH_LABEL}
        hint="Как менялись за 90 дней"
        icon={<BarbellDoodle />}
      />
    </section>
  );
}
