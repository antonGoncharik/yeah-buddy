"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import {
  formatKcal,
  ONBOARDING_GOAL_OPTIONS,
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

export function OnboardingSexStep({
  sex,
  replay,
  fromWorkoutPack,
  onPick,
}: {
  sex: OnboardingSex | null;
  replay: boolean;
  fromWorkoutPack: boolean;
  onPick: (value: OnboardingSex) => void;
}) {
  return (
    <>
      {sexLead(replay, fromWorkoutPack) ? (
        <p
          className="animate-rise text-base text-muted-foreground"
          style={{ animationDelay: "40ms" }}
        >
          {sexLead(replay, fromWorkoutPack)}
        </p>
      ) : null}
      <div
        className="animate-rise grid grid-cols-2 gap-3"
        style={{ animationDelay: "80ms" }}
      >
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
    </>
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
    <div
      className="animate-rise flex flex-col gap-2"
      style={{ animationDelay: "40ms" }}
    >
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

export function OnboardingGoalStep({
  goal,
  onPick,
}: {
  goal: OnboardingGoal | null;
  onPick: (value: OnboardingGoal) => void;
}) {
  return (
    <div
      className="animate-rise flex flex-col gap-2"
      style={{ animationDelay: "40ms" }}
    >
      {ONBOARDING_GOAL_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={goal === option.id}
          className={cn(
            "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none",
            goal === option.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "card-surface hover:bg-muted/30",
          )}
          onClick={() => {
            if (goal !== option.id) {
              haptic("tick");
            } else {
              haptic("tap");
            }
            onPick(option.id);
          }}
        >
          <p className="text-lg font-medium">{option.label}</p>
          <p
            className={cn(
              "mt-1 text-sm",
              goal === option.id
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {option.hint}
          </p>
        </button>
      ))}
    </div>
  );
}

export function OnboardingTrainingAgeStep({
  trainingAge,
  onPick,
}: {
  trainingAge: UserTrainingAge | null;
  onPick: (value: UserTrainingAge) => void;
}) {
  return (
    <div
      className="animate-rise flex flex-col gap-2"
      style={{ animationDelay: "40ms" }}
    >
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
            onPick(option.id);
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function OnboardingMacrosStep({
  sex,
  weight,
  goal,
  proteinOverride,
  proteinInvalid,
  onProteinOverride,
}: {
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  proteinOverride: string | null;
  proteinInvalid: boolean;
  onProteinOverride: (value: string | null) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const weightKg = parseDecimal(weight);
  const override =
    proteinOverride != null ? parseDecimal(proteinOverride) : null;
  const preview =
    sex && goal && weightKg != null
      ? suggestMacroGoals({
          sex,
          weightKg,
          goal,
          protein:
            override != null && override > 0 && override <= 400
              ? override
              : null,
        })
      : null;
  const protein = preview?.protein ?? null;

  if (preview == null || protein == null) {
    return (
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Вернись назад и проверь вес, пол и цель — без них цифры не посчитать.
      </p>
    );
  }

  return (
    <div
      className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
      style={{ animationDelay: "40ms" }}
    >
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {protein} г белка
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Без зала — {formatKcal(preview.rest.kcal)} ккал, жир{" "}
        {preview.rest.fat} г, углеводы {preview.rest.carbs} г. В день
        тренировки — {formatKcal(preview.training.kcal)} ккал, углеводов{" "}
        {preview.training.carbs} г. Потом можно поменять в Настройках → «Цели
        на день».
      </p>
      {showCustom || proteinOverride != null ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-protein" className="text-sm">
            Свой белок, г
          </Label>
          <Input
            id="onboarding-protein"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            value={proteinOverride ?? String(protein)}
            aria-invalid={proteinInvalid || undefined}
            onChange={(event) =>
              onProteinOverride(sanitizeDecimalDraft(event.target.value))
            }
            className="h-12 text-base"
          />
        </div>
      ) : (
        <button
          type="button"
          className="text-left text-sm font-medium text-primary"
          onClick={() => {
            haptic("tap");
            setShowCustom(true);
            onProteinOverride(String(protein));
          }}
        >
          Поставить другой белок
        </button>
      )}
    </div>
  );
}

function sexLead(replay: boolean, fromWorkoutPack: boolean): string | null {
  if (fromWorkoutPack) {
    return "Программа возьмётся из ссылки. Сначала скажи, кто ты — без пола белок не посчитать.";
  }
  if (replay) {
    return "Заново посчитаем белок и калории. Еда на день и записи останутся на месте.";
  }
  return null;
}
