"use client";

import {
  ChartDoodle,
  DumbbellDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { REVIEW_LABEL } from "@/lib/workout/labels";

export function ProgressScreenLinks() {
  return (
    <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
      <NavRow
        href="/settings/review"
        title={REVIEW_LABEL}
        hint="За 14, 30 или 90 дней"
        icon={<ChartDoodle />}
      />
      <NavRow
        href="/today/history"
        title="История еды"
        hint="БЖУ и вес по дням"
        icon={<MealDayDoodle />}
      />
      <NavRow
        href="/workouts/muscles"
        title="Мышцы"
        hint="Схема нагрузки и пропусков"
        icon={<DumbbellDoodle />}
      />
      <NavRow
        href="/workouts/history"
        title="История тренировок"
        hint="Какие были занятия"
        icon={<DumbbellDoodle />}
      />
    </section>
  );
}
