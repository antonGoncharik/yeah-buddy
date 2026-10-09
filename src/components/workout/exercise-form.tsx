"use client";

import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseFormSettings } from "@/components/workout/exercise-form-settings";
import { ExerciseIdentityFields } from "@/components/workout/exercise-identity-fields";
import { ExerciseMaxHistory } from "@/components/workout/exercise-max-history";
import { ExerciseTechniquePanel } from "@/components/workout/exercise-technique-panel";
import { ExerciseTrackCard } from "@/components/workout/exercise-track-card";
import { useExerciseForm } from "@/components/workout/use-exercise-form";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

function maxWeightOutOfRange(raw: string): boolean {
  if (raw.trim() === "") {
    return false;
  }
  const parsed = parseDecimal(raw);
  return parsed == null || parsed <= 0 || parsed > 1000;
}

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

      {exercise && !canCorrectMax ? (
        <section className="card-surface flex flex-col gap-2 px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">
            Максимум на раз
          </p>
          <p className="text-3xl font-semibold tracking-tight">
            {exercise.current_max
              ? `${formatWeight(exercise.current_max.max_weight)} кг`
              : "не задан"}
          </p>
          <p className="text-sm leading-snug text-muted-foreground">
            От этого считаются проценты. Пока идёт цикл, меняется на смене
            недели — в «Недели».
          </p>
        </section>
      ) : (
        <section className="card-surface flex flex-col gap-3 px-5 py-5">
          <div className="flex flex-col gap-1">
            <Label className="text-lg font-semibold tracking-tight">
              {exercise ? "Максимум на раз" : "На раз, кг"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {exercise
                ? "Без цикла можно править здесь."
                : "От него считаются проценты в подходах."}
            </p>
          </div>
          <Input
            required
            inputMode="decimal"
            enterKeyHint="done"
            value={form.max_weight}
            aria-invalid={maxWeightOutOfRange(form.max_weight) || undefined}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                max_weight: sanitizeDecimalDraft(event.target.value),
              }))
            }
            onKeyDown={handleNumericEnter}
            className="h-12 text-base"
          />
          {maxWeightOutOfRange(form.max_weight) ? (
            <p className="text-base leading-snug text-destructive">
              Вес от 0,1 до 1000 кг.
            </p>
          ) : null}
        </section>
      )}

      <div className="flex flex-col gap-3">
        <SectionHeading title="Название" hint="Как видишь в списке и в зале." />
        <div className="card-surface flex flex-col gap-4 px-5 py-5">
          <ExerciseIdentityFields
            form={form}
            setForm={setForm}
            showActive={Boolean(exercise)}
            active={active}
            toggling={toggling}
            onToggleActive={(next) => void toggleActive(next)}
          />
        </div>
      </div>

      <ExerciseFormSettings
        form={form}
        setForm={setForm}
        defaultOpen={!exercise}
      />

      {exercise ? <ExerciseTrackCard exercise={exercise} /> : null}

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
