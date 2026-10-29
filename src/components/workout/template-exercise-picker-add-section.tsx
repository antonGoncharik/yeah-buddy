"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { AlignedPair } from "@/components/ui/aligned-pair";
import { Input } from "@/components/ui/input";
import type { ExerciseWithMax } from "@/lib/types";
import {
  exerciseCatalogWeight,
  exerciseShortLabel,
} from "@/lib/workout/labels";

export function TemplateExercisePickerAddSection({
  availableCount,
  showSearch,
  query,
  onQueryChange,
  needle,
  ordered,
  onToggle,
}: {
  availableCount: number;
  showSearch: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  needle: string;
  ordered: ExerciseWithMax[];
  onToggle: (id: string) => void;
}) {
  if (availableCount === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Добавить" />
      {showSearch ? (
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Найти упражнение"
          className="h-12 text-base"
          inputMode="search"
          enterKeyHint="search"
        />
      ) : null}
      {ordered.length === 0 ? (
        <div className="flex flex-col gap-2 px-1">
          <p className="text-base text-muted-foreground">Ничего не нашлось.</p>
          {needle ? (
            <Link
              href={`/workouts/exercises/new?name=${encodeURIComponent(query.trim())}`}
              className="text-base font-medium text-primary"
            >
              Создать «{query.trim()}»
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="card-surface divide-y divide-border/70 px-5 py-1">
          {ordered.map((exercise) => {
            const load = exerciseCatalogWeight(exercise);
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  onClick={() => onToggle(exercise.id)}
                >
                  <span className="min-w-0 flex-1 truncate text-base">
                    {exerciseShortLabel(exercise.short_name, exercise.name)}
                    {exercise.is_active ? null : (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        не делаю
                      </span>
                    )}
                  </span>
                  <AlignedPair
                    className="grid-cols-[3.25rem_1.75rem]"
                    leading={
                      load ? (
                        <span className="text-sm text-muted-foreground">
                          {load.kg}
                        </span>
                      ) : null
                    }
                    trailing={
                      <span className="text-sm text-muted-foreground">
                        {load ? load.hint : ""}
                      </span>
                    }
                  />
                  <Plus className="size-5 shrink-0 text-primary" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
