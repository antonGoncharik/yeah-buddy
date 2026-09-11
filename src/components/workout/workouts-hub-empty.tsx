"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  WORKOUTS_NEED_EXERCISES,
  WORKOUTS_NEED_TEMPLATES,
} from "@/lib/messages";
import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkoutsHubEmpty({
  exercisesCount,
  session,
  nextTemplate,
}: {
  exercisesCount: number;
  session: WorkoutSession | null;
  nextTemplate: WorkoutTemplateDetail | null;
}) {
  if (exercisesCount === 0) {
    return (
      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
        <p className="text-lg font-medium">{WORKOUTS_NEED_EXERCISES}</p>
        <Link
          href="/workouts/exercises/new"
          className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
        >
          <Plus className="size-5" aria-hidden />
          Новое упражнение
        </Link>
      </section>
    );
  }

  if (!session && !nextTemplate) {
    return (
      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
        <p className="text-lg font-medium">{WORKOUTS_NEED_TEMPLATES}</p>
        <Link
          href="/workouts/schedule"
          className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
        >
          <Plus className="size-5" aria-hidden />
          Поставить программу
        </Link>
      </section>
    );
  }

  return null;
}
