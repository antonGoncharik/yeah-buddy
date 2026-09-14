"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SortableList } from "@/components/workout/sortable-list";
import type { ExerciseWithMax } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function TemplateExercisePicker({
  selected,
  available,
  onReorder,
  onToggle,
}: {
  selected: ExerciseWithMax[];
  available: ExerciseWithMax[];
  onReorder: (next: ExerciseWithMax[]) => void;
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? available.filter((exercise) =>
        `${exercise.name} ${exercise.short_name ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : available;
  // Exercises with a working weight are the ones actually in use — first.
  const ordered = [...matches].sort((a, b) => {
    const aMax = a.current_max?.max_weight ?? 0;
    const bMax = b.current_max?.max_weight ?? 0;
    if (aMax > 0 !== bMax > 0) {
      return aMax > 0 ? -1 : 1;
    }
    return 0;
  });

  return (
    <>
      <section className="flex flex-col gap-2">
        <SectionHeading
          title="Упражнения"
          hint={
            selected.length > 1
              ? "Порядок в списке — порядок в зале. Тяни за номер."
              : "Порядок в списке — порядок в зале."
          }
        />
        {selected.length === 0 ? (
          <p className="card-surface px-5 py-4 text-base text-muted-foreground">
            Пока пусто. Добавь из списка ниже.
          </p>
        ) : (
          <div className="card-surface px-3 py-1">
            <SortableList
              items={selected}
              onReorder={onReorder}
              renderItem={(exercise) => (
                <>
                  <p className="min-w-0 flex-1 px-1 text-base font-medium leading-snug">
                    {exerciseShortLabel(exercise.short_name, exercise.name)}
                  </p>
                  <RemoveRowButton onClick={() => onToggle(exercise.id)} />
                </>
              )}
            />
          </div>
        )}
      </section>

      {available.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeading title="Добавить" />
          {available.length > 8 ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти упражнение"
              className="h-12 text-base"
              inputMode="search"
              enterKeyHint="search"
            />
          ) : null}
          {ordered.length === 0 ? (
            <p className="px-1 text-base text-muted-foreground">
              Ничего не нашлось.
            </p>
          ) : (
            <ul className="card-surface divide-y divide-border/70 px-5 py-1">
              {ordered.map((exercise) => {
                const max = exercise.current_max?.max_weight ?? 0;
                return (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                      onClick={() => onToggle(exercise.id)}
                    >
                      <span className="min-w-0 flex-1 truncate text-base">
                        {exerciseShortLabel(exercise.short_name, exercise.name)}
                      </span>
                      {max > 0 ? (
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                          {formatWeight(max)} кг
                        </span>
                      ) : null}
                      <Plus
                        className="size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
