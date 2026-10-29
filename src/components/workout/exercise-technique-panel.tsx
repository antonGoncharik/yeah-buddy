"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { ExerciseTechniqueCatalogPicker } from "@/components/workout/exercise-technique-catalog-picker";
import { ExerciseTechniquePreview } from "@/components/workout/exercise-technique-preview";
import { useExerciseCatalogLink } from "@/components/workout/use-exercise-catalog-link";
import type { ExerciseWithMax } from "@/lib/types";

export function ExerciseTechniquePanel({
  exercise,
  onLinked,
}: {
  exercise: ExerciseWithMax;
  onLinked: (next: ExerciseWithMax) => void;
}) {
  const searchInputId = useId();
  const linked = exercise.catalog_exercise_id != null;
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(!linked);
  const [query, setQuery] = useState("");
  const link = useExerciseCatalogLink({ exerciseId: exercise.id, onLinked });

  async function linkCatalog(item: Parameters<typeof link.linkCatalog>[0]) {
    const next = await link.linkCatalog(item);
    if (next) {
      setQuery("");
      setPickerOpen(next.catalog_exercise_id == null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="card-surface flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        <span className="text-lg font-semibold tracking-tight">Как делать</span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded
        onClick={() => setOpen(false)}
      >
        <h2 className="text-lg font-semibold tracking-tight">Как делать</h2>
        <ChevronDown className="size-5 shrink-0 rotate-180 text-muted-foreground" />
      </button>

      {linked && exercise.catalog_exercise_id ? (
        <ExerciseTechniquePreview
          catalogExerciseId={exercise.catalog_exercise_id}
          pickerOpen={pickerOpen}
          onOpenPicker={() => setPickerOpen(true)}
        />
      ) : null}

      {!linked || pickerOpen ? (
        <ExerciseTechniqueCatalogPicker
          searchInputId={searchInputId}
          linked={linked}
          query={query}
          onQueryChange={setQuery}
          linkError={link.linkError}
          pendingId={link.pendingId}
          onPick={(item) => void linkCatalog(item)}
          onCancelReplace={
            linked
              ? () => {
                  setPickerOpen(false);
                  setQuery("");
                }
              : undefined
          }
        />
      ) : null}

      {linked && !pickerOpen ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 text-base"
            onClick={() => setPickerOpen(true)}
          >
            Заменить
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-base"
            disabled={link.pendingId != null}
            onClick={() => void linkCatalog(null)}
          >
            Отвязать
          </Button>
        </div>
      ) : null}
    </section>
  );
}
