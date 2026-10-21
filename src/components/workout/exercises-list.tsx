"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { AlignedPair } from "@/components/ui/aligned-pair";
import type { ExerciseGroups } from "@/components/workout/use-exercises-screen";
import type { ExerciseWithMax } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  exerciseCatalogWeight,
  exerciseShortLabel,
} from "@/lib/workout/labels";

export function ExercisesList({
  groups,
  searching,
}: {
  groups: ExerciseGroups;
  searching: boolean;
}) {
  const [idleOpen, setIdleOpen] = useState(false);
  const showIdle = groups.idle.length > 0 && (idleOpen || searching);

  return (
    <>
      {groups.queued.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeading
            title="В тренировках"
            hint="Справа «на раз» или «штанга» — какое число у этого упражнения."
          />
          <ExerciseRows exercises={groups.queued} />
        </section>
      ) : null}

      {groups.rest.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeading
            title={groups.queued.length > 0 ? "Остальные" : "Упражнения"}
            hint={
              groups.queued.length > 0
                ? "Не в программе, но можно добавить в тренировку."
                : undefined
            }
          />
          <ExerciseRows exercises={groups.rest} />
        </section>
      ) : null}

      {groups.idle.length > 0 ? (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-1 text-left"
            aria-expanded={showIdle}
            onClick={() => setIdleOpen((current) => !current)}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">
                Не делаю
                <span className="ml-2 text-base font-medium text-muted-foreground tabular-nums">
                  {groups.idle.length}
                </span>
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                В тренировки не попадают. Вернуть можно внутри упражнения.
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-out-soft)]",
                showIdle && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {showIdle ? <ExerciseRows exercises={groups.idle} muted /> : null}
        </section>
      ) : null}
    </>
  );
}

function ExerciseRows({
  exercises,
  muted = false,
}: {
  exercises: ExerciseWithMax[];
  muted?: boolean;
}) {
  return (
    <ul className="card-surface divide-y divide-border/70 px-5 py-1">
      {exercises.map((exercise) => {
        const load = exerciseCatalogWeight(exercise);
        return (
          <li key={exercise.id}>
            <Link
              href={`/workouts/exercises/${exercise.id}`}
              className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-base font-medium",
                  muted && "text-muted-foreground",
                )}
              >
                {exerciseShortLabel(exercise.short_name, exercise.name)}
              </span>
              <AlignedPair
                beside
                leading={
                  load ? (
                    <span className="text-base font-semibold">{load.kg}</span>
                  ) : null
                }
                trailing={
                  load?.hint === "штанга" ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      штанга
                    </span>
                  ) : load ? null : (
                    <span className="text-sm font-medium text-muted-foreground">
                      —
                    </span>
                  )
                }
              />
              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
