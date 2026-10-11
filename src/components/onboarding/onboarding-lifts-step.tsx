"use client";

import { OnboardingPrimaryAction } from "@/components/onboarding/onboarding-step-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { UserSex, UserTrainingAge } from "@/lib/types";
import {
  type AnchorLift,
  estimateAnchorMax,
} from "@/lib/workout/estimate-maxes";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

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

function liftPreviewKg(
  sex: UserSex | null,
  trainingAge: UserTrainingAge | null,
  weightKg: number | null,
  lift: AnchorLift,
  knownRaw: string | null,
): number | null {
  if (sex == null || trainingAge == null || weightKg == null) {
    return null;
  }
  const known = parseDecimal(knownRaw ?? "");
  return estimateAnchorMax({
    sex,
    trainingAge,
    weightKg,
    lift,
    knownKg: known != null && known > 0 ? known : null,
  });
}

export function OnboardingLiftsStep({
  answers,
  onChange,
  sex = null,
  trainingAge = null,
  bodyWeightKg = null,
  saving = false,
  isLast = false,
  onConfirm,
  onSkip,
}: {
  answers: LiftAnswers;
  onChange: (key: LiftKey, value: string | null) => void;
  sex?: UserSex | null;
  trainingAge?: UserTrainingAge | null;
  bodyWeightKg?: number | null;
  saving?: boolean;
  isLast?: boolean;
  onConfirm?: () => void;
  onSkip?: () => void;
}) {
  const previews = ONBOARDING_LIFT_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    kg: liftPreviewKg(
      sex,
      trainingAge,
      bodyWeightKg,
      field.id,
      answers[field.id],
    ),
  }));
  const showPreview = previews.some((item) => item.kg != null);

  return (
    <div className="flex flex-col gap-3 pb-2">
      <p className="text-base text-muted-foreground">
        Если знаешь присед, жим или становую — впиши вес. Остальные упражнения в
        программе получат оценку по твоему профилю; её можно поправить после
        тренировок.
      </p>
      {showPreview ? (
        <ul className="card-surface flex flex-col gap-2 px-5 py-4 text-sm text-muted-foreground">
          {previews.map((item) =>
            item.kg == null ? null : (
              <li
                key={item.id}
                className="flex justify-between gap-3 tabular-nums"
              >
                <span>{item.label}</span>
                <span className="font-medium text-foreground">
                  ~{formatWeight(item.kg)} кг
                </span>
              </li>
            ),
          )}
        </ul>
      ) : null}
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
      {onConfirm ? (
        <div className="flex flex-col gap-2 pt-1">
          {onSkip ? (
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full text-base"
              data-keyboard-secondary
              disabled={saving}
              onClick={onSkip}
            >
              Не знаю — посчитай сам
            </Button>
          ) : null}
          <OnboardingPrimaryAction
            saving={saving}
            isLast={isLast}
            onClick={onConfirm}
          />
        </div>
      ) : null}
    </div>
  );
}
