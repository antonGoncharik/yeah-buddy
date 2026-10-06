"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";

export type LiftKey = "squat" | "bench" | "deadlift";

export const ONBOARDING_LIFT_FIELDS: Array<{
  id: LiftKey;
  label: string;
}> = [
  { id: "squat", label: "Присед" },
  { id: "bench", label: "Жим" },
  { id: "deadlift", label: "Становая" },
];

export type LiftAnswers = Record<LiftKey, string | null>;

export function OnboardingLiftsStep({
  answers,
  onChange,
}: {
  answers: LiftAnswers;
  onChange: (key: LiftKey, value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 pb-2">
      <p className="text-sm leading-snug text-muted-foreground">
        Знаешь рабочие максимумы — напиши. Нет — посчитаем по весу и стажу.
      </p>
      <div className="card-surface grid grid-cols-3 gap-2 px-3 py-3">
        {ONBOARDING_LIFT_FIELDS.map((field) => {
          const unknown = answers[field.id] === null;
          const value = answers[field.id] ?? "";
          return (
            <div key={field.id} className="flex min-w-0 flex-col gap-1">
              <Label
                htmlFor={`onboarding-lift-${field.id}`}
                className="truncate text-xs text-muted-foreground"
              >
                {field.label}
              </Label>
              <Input
                id={`onboarding-lift-${field.id}`}
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                disabled={unknown}
                value={unknown ? "" : value}
                placeholder="кг"
                onChange={(event) =>
                  onChange(field.id, sanitizeDecimalDraft(event.target.value))
                }
                className="h-10 px-2 text-center text-base tabular-nums"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
