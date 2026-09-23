"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { haptic } from "@/lib/telegram/haptic";

export type LiftKey = "squat" | "bench" | "deadlift";

export const ONBOARDING_LIFT_FIELDS: Array<{
  id: LiftKey;
  label: string;
}> = [
  { id: "squat", label: "Присед" },
  { id: "bench", label: "Жим лёжа" },
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
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Если знаешь присед, жим или становую — напиши. Нет — поставим примерные
        максимумы на раз, потом поправишь.
      </p>
      <div className="flex flex-col gap-3">
        {ONBOARDING_LIFT_FIELDS.map((field, index) => {
          const unknown = answers[field.id] === null;
          const value = answers[field.id] ?? "";
          return (
            <div
              key={field.id}
              className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
              style={{ animationDelay: `${80 + index * 40}ms` }}
            >
              <Label
                htmlFor={`onboarding-lift-${field.id}`}
                className="text-base font-medium"
              >
                {field.label}, кг
              </Label>
              <Input
                id={`onboarding-lift-${field.id}`}
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                disabled={unknown}
                value={unknown ? "" : value}
                placeholder={unknown ? "не знаю" : "кг"}
                onChange={(event) =>
                  onChange(field.id, sanitizeDecimalDraft(event.target.value))
                }
                className="h-12 text-base"
              />
              <Button
                type="button"
                variant={unknown ? "default" : "outline"}
                className="h-11 text-base"
                onClick={() => {
                  haptic("tick");
                  onChange(field.id, unknown ? "" : null);
                }}
              >
                Не знаю
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
