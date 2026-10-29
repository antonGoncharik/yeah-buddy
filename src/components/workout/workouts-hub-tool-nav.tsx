"use client";

import {
  BarbellDoodle,
  ChartDoodle,
  DumbbellDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { reviewHref } from "@/lib/ai/review-nav";
import { REVIEW_LABEL, STRENGTH_LABEL } from "@/lib/workout/labels";
import { HUB_WEIGHT_NAV_HINT } from "@/lib/workout/user-copy";

export function WorkoutsHubToolNav() {
  return (
    <section className="card-surface divide-y divide-border/70 px-5 py-2">
      <NavRow
        href="/workouts/exercises"
        title="Упражнения"
        hint={HUB_WEIGHT_NAV_HINT}
        icon={<DumbbellDoodle />}
      />
      <NavRow
        href="/workouts/progress"
        title={STRENGTH_LABEL}
        hint="За 90 дней и с первой записи"
        icon={<BarbellDoodle />}
      />
      <NavRow
        href="/workouts/muscles"
        title="Мышцы"
        hint="Схема нагрузки и пропусков"
        icon={<ChartDoodle />}
      />
      <NavRow
        href={reviewHref("workouts")}
        title={REVIEW_LABEL}
        hint="За 14, 30 или 90 дней"
        icon={<ChartDoodle />}
      />
    </section>
  );
}
