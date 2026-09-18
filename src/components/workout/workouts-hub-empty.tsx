"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
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
      <EmptyNote
        icon={<DumbbellDoodle className="h-5 w-10" />}
        title={WORKOUTS_NEED_EXERCISES}
        action={
          <Link
            href="/workouts/exercises/new"
            className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
          >
            <Plus className="size-5" aria-hidden />
            Новое упражнение
          </Link>
        }
      />
    );
  }

  if (!session && !nextTemplate) {
    return (
      <EmptyNote
        icon={<DumbbellDoodle className="h-5 w-10" />}
        title={WORKOUTS_NEED_TEMPLATES}
        action={
          <Link
            href="/workouts/schedule"
            className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
          >
            <Plus className="size-5" aria-hidden />
            Поставить программу
          </Link>
        }
      />
    );
  }

  return null;
}
