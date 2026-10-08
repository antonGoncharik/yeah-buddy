"use client";

import { GoalOptionButtons } from "@/components/nutrition/goal-option-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import {
  formatKcal,
  ONBOARDING_SEX_OPTIONS,
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { UserTrainingAge } from "@/lib/types";
import { TRAINING_AGE_OPTIONS } from "@/lib/workout/estimate-maxes";
import { parseDecimal } from "@/lib/workout/numbers";

export function profileStepSubtitle(
  replay: boolean,
  fromWorkoutPack: boolean,
): string {
  if (fromWorkoutPack) {
    return "Программа из ссылки. Нужны пол и вес — посчитаем белок.";
  }
  if (replay) {
    return "Пересчитаем цели. Еда и записи останутся.";
  }
  return "Пол, вес и цель — посчитаем белок и калории.";
}

export function OnboardingSexStep({
  sex,
  onPick,
}: {
  sex: OnboardingSex | null;
  onPick: (value: OnboardingSex) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">Пол</Label>
      <div className="grid grid-cols-2 gap-3">
        {ONBOARDING_SEX_OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={sex === option.id ? "default" : "outline"}
            className="h-16 text-lg"
            onClick={() => {
              if (sex !== option.id) {
                haptic("tick");
              } else {
                haptic("tap");
              }
              onPick(option.id);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OnboardingWeightStep({
  weight,
  invalid,
  message,
  onChange,
}: {
  weight: string;
  invalid: boolean;
  message: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="onboarding-weight" className="text-base">
        Вес, кг
      </Label>
      <Input
        id="onboarding-weight"
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        value={weight}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(sanitizeDecimalDraft(event.target.value))}
        className="h-12 text-base"
      />
      {invalid && message ? (
        <p className="text-sm text-destructive">{message}</p>
      ) : null}
    </div>
  );
}

function weightLooksValid(raw: string): boolean {
  const kg = parseDecimal(raw);
  return kg != null && kg >= 30 && kg <= 250;
}

export function OnboardingMacrosSummary({
  sex,
  weight,
  goal,
  foodOnly = false,
}: {
  sex: OnboardingSex;
  weight: string;
  goal: OnboardingGoal;
  foodOnly?: boolean;
}) {
  const weightKg = parseDecimal(weight);
  const preview =
    weightKg != null
      ? suggestMacroGoals({ sex, weightKg, goal, protein: null })
      : null;

  if (preview == null) {
    return null;
  }

  return (
    <div className="card-surface flex flex-col gap-3 px-5 py-4">
      <p className="text-sm font-medium text-muted-foreground">
        Посчитали цели
      </p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {preview.protein} г белка
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {foodOnly
          ? `${formatKcal(preview.rest.kcal)} ккал, жир ${preview.rest.fat} г, углеводы ${preview.rest.carbs} г. Свой БЖУ можно поменять в Настройках → «Цели на день».`
          : `Без зала — ${formatKcal(preview.rest.kcal)} ккал, жир ${preview.rest.fat} г, углеводы ${preview.rest.carbs} г. В день тренировки — ${formatKcal(preview.training.kcal)} ккал, углеводов ${preview.training.carbs} г. Свой БЖУ всегда можно изменить в Настройках → «Цели на день».`}
      </p>
    </div>
  );
}

export function OnboardingProfileStep({
  sex,
  weight,
  goal,
  trainingAge,
  weightInvalid,
  weightMessage,
  onSexPick,
  onWeightChange,
  onGoalPick,
  onTrainingAgePick,
  foodOnly = false,
}: {
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  trainingAge: UserTrainingAge | null;
  foodOnly?: boolean;
  weightInvalid: boolean;
  weightMessage: string | null;
  onSexPick: (value: OnboardingSex) => void;
  onWeightChange: (value: string) => void;
  onGoalPick: (value: OnboardingGoal) => void;
  onTrainingAgePick: (value: UserTrainingAge) => void;
}) {
  const showWeight = sex != null;
  const showGoal = showWeight && weightLooksValid(weight);
  const showTrainingAge = !foodOnly && showGoal && goal != null;
  const showMacros = foodOnly
    ? showGoal && goal != null && sex != null
    : showTrainingAge && trainingAge != null && sex != null && goal != null;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <OnboardingSexStep sex={sex} onPick={onSexPick} />

      {showWeight ? (
        <OnboardingWeightStep
          weight={weight}
          invalid={weightInvalid}
          message={weightMessage}
          onChange={onWeightChange}
        />
      ) : null}

      {showGoal ? (
        <div className="flex flex-col gap-2">
          <Label className="text-base">Цель</Label>
          <GoalOptionButtons value={goal} onPick={onGoalPick} />
        </div>
      ) : null}

      {showTrainingAge ? (
        <div className="flex flex-col gap-2">
          <Label className="text-base">Стаж</Label>
          <div className="flex flex-col gap-2">
            {TRAINING_AGE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={trainingAge === option.id ? "default" : "outline"}
                className="h-14 justify-start text-base"
                onClick={() => {
                  if (trainingAge !== option.id) {
                    haptic("tick");
                  } else {
                    haptic("tap");
                  }
                  onTrainingAgePick(option.id);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {showMacros && sex != null && goal != null ? (
        <OnboardingMacrosSummary
          sex={sex}
          weight={weight}
          goal={goal}
          foodOnly={foodOnly}
        />
      ) : null}
    </div>
  );
}
