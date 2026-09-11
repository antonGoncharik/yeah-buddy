"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingState } from "@/lib/onboarding";
import { exerciseShortLabel } from "@/lib/workout/labels";

export function OnboardingMaxesStep({
  exercises,
  values,
  onChange,
}: {
  exercises: OnboardingState["exercises"];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Рабочий вес, не на раз. Пустое допишешь в зале.
      </p>
      <div
        className="card-surface animate-rise divide-y divide-border/70 px-5"
        style={{ animationDelay: "80ms" }}
      >
        {exercises.map((exercise) => (
          <div key={exercise.id} className="flex items-center gap-3 py-3">
            <Label
              htmlFor={`max-${exercise.id}`}
              className="min-w-0 flex-1 text-base font-medium"
            >
              {exerciseShortLabel(exercise.short_name, exercise.name)}
            </Label>
            <Input
              id={`max-${exercise.id}`}
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="кг"
              value={values[exercise.id] ?? ""}
              onChange={(event) => onChange(exercise.id, event.target.value)}
              className="h-12 w-24 shrink-0 scroll-mb-36 text-base tabular-nums"
            />
          </div>
        ))}
      </div>
    </>
  );
}
