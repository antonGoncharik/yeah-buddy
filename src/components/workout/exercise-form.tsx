"use client";

import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseIdentityFields } from "@/components/workout/exercise-identity-fields";
import { ExerciseMaxHistory } from "@/components/workout/exercise-max-history";
import { ExerciseTrackCard } from "@/components/workout/exercise-track-card";
import { ExerciseTypeFields } from "@/components/workout/exercise-type-fields";
import { useExerciseForm } from "@/components/workout/use-exercise-form";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";

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

  return (
    <form className="flex flex-col gap-4 pb-36" onSubmit={onSubmit}>
      <ExerciseIdentityFields
        form={form}
        setForm={setForm}
        showActive={Boolean(exercise)}
        active={active}
        toggling={toggling}
        onToggleActive={(next) => void toggleActive(next)}
      />

      <ExerciseTypeFields form={form} setForm={setForm} />

      {exercise && !canCorrectMax ? (
        <div className="card-surface flex scroll-mb-36 flex-col gap-2 px-5 py-4">
          <p className="text-base font-medium">1ПМ</p>
          <p className="text-2xl font-semibold tracking-tight">
            {exercise.current_max
              ? `${formatWeight(exercise.current_max.max_weight)} кг`
              : "не задан"}
          </p>
          <p className="text-sm text-muted-foreground">
            От этого максимума считаются проценты. Идёт цикл, поэтому здесь он
            не меняется: поднять — на смене этапа, поправить текущий — в «Цикл».
          </p>
        </div>
      ) : (
        <Field label="1ПМ, кг">
          <Input
            required
            inputMode="decimal"
            enterKeyHint="done"
            value={form.max_weight}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                max_weight: event.target.value,
              }))
            }
            onKeyDown={handleNumericEnter}
            className="h-12 text-base"
          />
          <p className="text-sm text-muted-foreground">
            {exercise
              ? "От этого максимума считаются проценты. Без цикла меняй здесь."
              : "От этого максимума считаются проценты в подходах."}
          </p>
        </Field>
      )}

      {exercise ? <ExerciseTrackCard exercise={exercise} /> : null}

      {exercise ? <ExerciseMaxHistory exercise={exercise} /> : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <StickyActions>
        <Button type="submit" className="h-14 text-lg" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
    </div>
  );
}
