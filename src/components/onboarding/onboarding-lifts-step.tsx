"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { parseDecimal } from "@/lib/workout/numbers";

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

export const LIFTS_DRAFT_INVALID =
  "Проверь веса — только числа в килограммах, до 500.";
export const LIFTS_NEED_INPUT_OR_SKIP =
  "Введи хотя бы один вес или нажми «Не знаю — посчитай сам».";

export function liftAnswersHaveInput(answers: LiftAnswers): boolean {
  return ONBOARDING_LIFT_FIELDS.some((field) => {
    const raw = answers[field.id];
    return raw != null && raw.trim() !== "";
  });
}

export function liftAnswersDraftInvalid(answers: LiftAnswers): boolean {
  for (const field of ONBOARDING_LIFT_FIELDS) {
    const raw = answers[field.id];
    if (raw == null || raw.trim() === "") {
      continue;
    }
    const kg = parseDecimal(raw);
    if (kg == null || !(kg > 0) || kg > 500) {
      return true;
    }
  }
  return false;
}

export function OnboardingLiftsStep({
  answers,
  onChange,
}: {
  answers: LiftAnswers;
  onChange: (key: LiftKey, value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-3 pb-2">
      <p className="text-base text-muted-foreground">
        Если знаешь присед, жим или становую — напиши и нажми «Дальше». Если нет
        — «Не знаю — посчитай сам».
      </p>
      <div className="flex flex-col gap-3">
        {ONBOARDING_LIFT_FIELDS.map((field) => {
          const value = answers[field.id] ?? "";
          return (
            <div
              key={field.id}
              className="card-surface flex flex-col gap-3 px-5 py-4"
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
                value={value}
                placeholder="кг"
                onChange={(event) =>
                  onChange(field.id, sanitizeDecimalDraft(event.target.value))
                }
                className="h-12 text-base"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
