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

export function OnboardingSexStep({
  sex,
  replay,
  fromWorkoutPack,
  onPick,
  showLead = true,
}: {
  sex: OnboardingSex | null;
  replay: boolean;
  fromWorkoutPack: boolean;
  onPick: (value: OnboardingSex) => void;
  showLead?: boolean;
}) {
  return (
    <>
      {showLead && sexLead(replay, fromWorkoutPack) ? (
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
    <div className="animate-rise" style={{ animationDelay: "40ms" }}>
      <GoalOptionButtons value={goal} onPick={onPick} />
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
}: {
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
}) {
  const weightKg = parseDecimal(weight);
  const preview =
    sex && goal && weightKg != null
      ? suggestMacroGoals({ sex, weightKg, goal, protein: null })
      : null;
  const protein = preview?.protein ?? null;

  if (preview == null || protein == null) {
    return null;
  }

  return (
    <div
      className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
      style={{ animationDelay: "40ms" }}
    >
      <p className="text-sm font-medium text-muted-foreground">
        Посчитали цели
      </p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {protein} г белка
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Без зала — {formatKcal(preview.rest.kcal)} ккал, жир {preview.rest.fat}{" "}
        г, углеводы {preview.rest.carbs} г. В день тренировки —{" "}
        {formatKcal(preview.training.kcal)} ккал, углеводов{" "}
        {preview.training.carbs} г. Свой белок — в Настройках → «Цели на день».
      </p>
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

export function OnboardingProfileStep({
  sex,
  weight,
  goal,
  trainingAge,
  weightInvalid,
  weightMessage,
  replay,
  fromWorkoutPack,
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
  replay: boolean;
  fromWorkoutPack: boolean;
  onSexPick: (value: OnboardingSex) => void;
  onWeightChange: (value: string) => void;
  onGoalPick: (value: OnboardingGoal) => void;
  onTrainingAgePick: (value: UserTrainingAge) => void;
}) {
  const lead = sexLead(replay, fromWorkoutPack);
  const weightKg = parseDecimal(weight);
  const showMacros =
    sex != null &&
    goal != null &&
    trainingAge != null &&
    weightKg != null &&
    weightKg >= 30 &&
    weightKg <= 250;

  return (
    <div className="flex flex-col gap-4">
      {lead ? (
        <p
          className="animate-rise text-base text-muted-foreground"
          style={{ animationDelay: "40ms" }}
        >
          {lead}
        </p>
      ) : (
        <p
          className="animate-rise text-base text-muted-foreground"
          style={{ animationDelay: "40ms" }}
        >
          За пару минут настроим белок и тренировки. Потом просто записывай еду
          и зал.
        </p>
      )}
      <OnboardingSexStep
        sex={sex}
        replay={replay}
        fromWorkoutPack={fromWorkoutPack}
        showLead={false}
        onPick={onSexPick}
      />
      <OnboardingWeightStep
        weight={weight}
        invalid={weightInvalid}
        message={weightMessage}
        onChange={onWeightChange}
      />
      <OnboardingGoalStep goal={goal} onPick={onGoalPick} />
      <OnboardingTrainingAgeStep
        trainingAge={trainingAge}
        onPick={onTrainingAgePick}
      />
      {showMacros ? (
        <OnboardingMacrosStep sex={sex} weight={weight} goal={goal} />
      ) : null}
    </div>
  );
}
