"use client";

import Link from "next/link";

import type { HubSessionState } from "@/lib/workout/hub-payload";

export function TodayNextSession({ peek }: { peek: HubSessionState | null }) {
  const template = peek?.nextTemplate;
  if (!template) {
    return null;
  }

  const count = template.exercises.length;
  const countLabel =
    count === 1
      ? "1 упражнение"
      : count >= 2 && count <= 4
        ? `${count} упражнения`
        : `${count} упражнений`;

  return (
    <Link
      href="/workouts"
      className="px-1 text-base font-medium text-foreground"
    >
      Сегодня: {template.name}, {countLabel}
    </Link>
  );
}
