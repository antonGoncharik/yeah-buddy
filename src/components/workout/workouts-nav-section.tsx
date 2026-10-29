"use client";

import {
  BarbellDoodle,
  ChartDoodle,
  DumbbellDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { REVIEW_LABEL, STRENGTH_LABEL } from "@/lib/workout/labels";

const LINKS = {
  review: {
    href: "/settings/review",
    title: REVIEW_LABEL,
    hint: "За 14, 30 или 90 дней",
    icon: <ChartDoodle />,
  },
  food: (href: string) => ({
    href,
    title: "История еды",
    hint: "БЖУ и вес по дням",
    icon: <MealDayDoodle />,
  }),
  progress: {
    href: "/workouts/progress",
    title: STRENGTH_LABEL,
    hint: "Как менялись за 90 дней",
    icon: <BarbellDoodle />,
  },
  muscles: {
    href: "/workouts/muscles",
    title: "Мышцы",
    hint: "Схема нагрузки и пропусков",
    icon: <DumbbellDoodle />,
  },
  history: {
    href: "/workouts/history",
    title: "История тренировок",
    hint: "Какие были занятия",
    icon: <DumbbellDoodle />,
  },
} as const;

export type WorkoutsNavLinkId = keyof typeof LINKS;

export function WorkoutsNavSection({
  items,
  foodHistoryHref = "/today/history",
}: {
  items: readonly WorkoutsNavLinkId[];
  foodHistoryHref?: string;
}) {
  return (
    <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
      {items.map((id) => {
        const row = id === "food" ? LINKS.food(foodHistoryHref) : LINKS[id];
        return (
          <NavRow
            key={id}
            href={row.href}
            title={row.title}
            hint={row.hint}
            icon={row.icon}
          />
        );
      })}
    </section>
  );
}
