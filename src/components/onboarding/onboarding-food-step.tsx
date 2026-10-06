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
import { cn } from "@/lib/utils";
import { TRAINING_AGE_OPTIONS } from "@/lib/workout/estimate-maxes";
import { parseDecimal } from "@/lib/workout/numbers";

const TRAINING_AGE_SHORT: Record<UserTrainingAge, string> = {
  beginner: "Начал",
  year: "~ год",
  years: "Годы",
};

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
  compact = false,
}: {
  sex: OnboardingSex | null;
  onPick: (value: OnboardingSex) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm text-muted-foreground">Пол</Label>
      <div className="grid grid-cols-2 gap-2">
        {ONBOARDING_SEX_OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={sex === option.id ? "default" : "outline"}
            className={cn("text-base", compact ? "h-11" : "h-16 text-lg")}
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
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor="onboarding-weight"
        className="text-sm text-muted-foreground"
      >
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
        className="h-11 text-base"
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
}: {
  sex: OnboardingSex;
  weight: string;
  goal: OnboardingGoal;
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
    <div className="rounded-2xl bg-muted/60 px-4 py-3">
      <p className="text-lg font-semibold tracking-tight tabular-nums">
        {preview.protein} г белка · {formatKcal(preview.rest.kcal)} ккал
      </p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
        В день зала — {formatKcal(preview.training.kcal)} ккал. Поменять в
        Настройках → «Цели на день».
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
}: {
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  trainingAge: UserTrainingAge | null;
  weightInvalid: boolean;
  weightMessage: string | null;
  onSexPick: (value: OnboardingSex) => void;
  onWeightChange: (value: string) => void;
  onGoalPick: (value: OnboardingGoal) => void;
  onTrainingAgePick: (value: UserTrainingAge) => void;
}) {
  const showWeight = sex != null;
  const showGoal = showWeight && weightLooksValid(weight);
  const showTrainingAge = showGoal && goal != null;
  const showMacros =
    showTrainingAge && trainingAge != null && sex != null && goal != null;

  return (
    <div className="flex flex-col gap-3 pb-2">
      <OnboardingSexStep sex={sex} onPick={onSexPick} compact />

      {showWeight ? (
        <OnboardingWeightStep
          weight={weight}
          invalid={weightInvalid}
          message={weightMessage}
          onChange={onWeightChange}
        />
      ) : null}

      {showGoal ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm text-muted-foreground">Цель</Label>
          <GoalOptionButtons value={goal} size="compact" onPick={onGoalPick} />
        </div>
      ) : null}

      {showTrainingAge ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm text-muted-foreground">Стаж в зале</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {TRAINING_AGE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={trainingAge === option.id ? "default" : "outline"}
                className="h-auto min-h-10 px-1 py-2 text-xs leading-tight whitespace-normal"
                onClick={() => {
                  if (trainingAge !== option.id) {
                    haptic("tick");
                  } else {
                    haptic("tap");
                  }
                  onTrainingAgePick(option.id);
                }}
              >
                {TRAINING_AGE_SHORT[option.id]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {showMacros ? (
        <OnboardingMacrosSummary sex={sex} weight={weight} goal={goal} />
      ) : null}
    </div>
  );
}
