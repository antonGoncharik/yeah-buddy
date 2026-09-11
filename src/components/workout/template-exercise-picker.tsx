"use client";

import { Button } from "@/components/ui/button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SortableList } from "@/components/workout/sortable-list";
import type { ExerciseWithMax } from "@/lib/types";

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
  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Упражнения</h2>
        {selected.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Порядок в списке — порядок в зале.
          </p>
        ) : (
          <SortableList
            items={selected}
            onReorder={onReorder}
            renderItem={(exercise) => (
              <>
                <p className="min-w-0 flex-1 px-1 text-base font-medium leading-snug">
                  {exercise.short_name || exercise.name}
                </p>
                <RemoveRowButton onClick={() => onToggle(exercise.id)} />
              </>
            )}
          />
        )}
      </section>

      {available.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">Добавить</h2>
          <div className="flex flex-wrap gap-2">
            {available.map((exercise) => (
              <Button
                key={exercise.id}
                type="button"
                variant="outline"
                className="h-10 rounded-full px-3.5 text-sm font-medium"
                onClick={() => onToggle(exercise.id)}
              >
                {exercise.short_name || exercise.name}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
