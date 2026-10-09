"use client";

import { useEffect, useState } from "react";

import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { ExerciseFormSettings } from "@/components/workout/exercise-form-settings";
import { ExerciseIdentityFields } from "@/components/workout/exercise-identity-fields";
import {
  ExerciseLoadsSection,
  ExerciseLoadsSectionNew,
} from "@/components/workout/exercise-loads-section";
import { ExerciseMaxHistory } from "@/components/workout/exercise-max-history";
import { ExerciseTechniquePanel } from "@/components/workout/exercise-technique-panel";
import { useExerciseForm } from "@/components/workout/use-exercise-form";
import type { ExerciseWithMax } from "@/lib/types";

export function ExerciseForm({ exercise }: { exercise?: ExerciseWithMax }) {
  const {
    form,
    setForm,
    error,
    saving,
    canCorrectMax,
    active,
    toggling,
    onSubmit,
    toggleActive,
  } = useExerciseForm(exercise);
  const [catalogExerciseId, setCatalogExerciseId] = useState(
    exercise?.catalog_exercise_id ?? null,
  );

  useEffect(() => {
    setCatalogExerciseId(exercise?.catalog_exercise_id ?? null);
  }, [exercise?.catalog_exercise_id]);

  const catalogExercise = exercise
    ? { ...exercise, catalog_exercise_id: catalogExerciseId }
    : null;

  return (
    <form
      className="flex flex-col gap-5 pb-36 animate-rise"
      onSubmit={onSubmit}
    >
      {catalogExercise ? (
        <ExerciseTechniquePanel
          exercise={catalogExercise}
          onLinked={(next) => setCatalogExerciseId(next.catalog_exercise_id)}
        />
      ) : null}

      <section className="card-surface flex flex-col gap-4 px-5 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Название</h2>
          <p className="text-sm text-muted-foreground">
            Как в списке и в тренировке — своё, не из каталога.
          </p>
        </div>
        <ExerciseIdentityFields
          form={form}
          setForm={setForm}
          showActive={Boolean(exercise)}
          active={active}
          toggling={toggling}
          onToggleActive={(next) => void toggleActive(next)}
        />
      </section>

      {exercise ? (
        <ExerciseLoadsSection
          exercise={exercise}
          form={form}
          setForm={setForm}
          canCorrectMax={canCorrectMax}
        />
      ) : (
        <ExerciseLoadsSectionNew form={form} setForm={setForm} />
      )}

      <ExerciseFormSettings
        form={form}
        setForm={setForm}
        defaultOpen={!exercise}
      />

      {exercise ? <ExerciseMaxHistory exercise={exercise} /> : null}

      {error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}

      <StickyActions>
        <Button type="submit" className="h-14 text-lg" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}
