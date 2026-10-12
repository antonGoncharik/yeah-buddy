"use client";

import { GoalOptionButtons } from "@/components/nutrition/goal-option-buttons";
import { OnboardingPrimaryAction } from "@/components/onboarding/onboarding-step-actions";
import { OnboardingWeightRuler } from "@/components/onboarding/onboarding-weight-ruler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { proteinPerKg } from "@/lib/day/body-weight";
import {
  formatKcal,
  ONBOARDING_SEX_OPTIONS,
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { paceHint } from "@/lib/nutrition/profile-energy";
import { haptic } from "@/lib/telegram/haptic";
import type { UserGoalPace, UserTrainingAge } from "@/lib/types";
import { TRAINING_AGE_OPTIONS } from "@/lib/workout/estimate-maxes";
import { parseDecimal } from "@/lib/workout/numbers";

export function profileStepSubtitle(
  replay: boolean,
  fromWorkoutPack: boolean,
): string | null {
  if (fromWorkoutPack) {
    return "Программа из ссылки. Нужны пол и вес — посчитаем белок.";
  }
  if (replay) {
    return "Пересчитаем цели. Еда и записи останутся.";
  }
  return null;
}

export function OnboardingSexStep({
  sex,
  onPick,
  showLabel = true,
}: {
  sex: OnboardingSex | null;
  onPick: (value: OnboardingSex) => void;
  showLabel?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {showLabel ? <Label className="text-base">Пол</Label> : null}
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
  sex,
  weight,
  invalid,
  message,
  onChange,
  showLabel = true,
  saving = false,
  onContinue,
}: {
  sex: OnboardingSex;
  weight: string;
  invalid: boolean;
  message: string | null;
  onChange: (value: string) => void;
  showLabel?: boolean;
  saving?: boolean;
  onContinue?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {showLabel ? <Label className="text-base">Вес</Label> : null}
      <OnboardingWeightRuler
        sex={sex}
        weight={weight}
        invalid={invalid}
        onChange={onChange}
      />
      {invalid && message ? (
        <p className="text-base leading-snug text-destructive">{message}</p>
      ) : null}
      {onContinue ? (
        <div className="mt-2">
          <OnboardingPrimaryAction saving={saving} onClick={onContinue} />
        </div>
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
    <div className="flex flex-col gap-2">
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
    <div className="flex flex-col gap-2">
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

function proteinLine(protein: number, weightKg: number | null): string {
  const perKg = weightKg != null ? proteinPerKg(protein, weightKg) : null;
  if (perKg == null) {
    return "";
  }
  const shown = perKg.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${shown} г на кг текущего веса.`;
}

export function OnboardingMacrosSummary({
  sex,
  weight,
  goal,
  activity = null,
  goalPace = null,
  heightCm = "",
  birthYear = "",
  foodOnly = false,
  saving = false,
  isLast = false,
  canEnterDiary = false,
  onContinue,
  onEnterDiary,
}: {
  sex: OnboardingSex;
  weight: string;
  goal: OnboardingGoal;
  activity?: import("@/lib/types").UserActivityLevel | null;
  goalPace?: UserGoalPace | null;
  heightCm?: string;
  birthYear?: string;
  foodOnly?: boolean;
  saving?: boolean;
  isLast?: boolean;
  canEnterDiary?: boolean;
  onContinue?: () => void;
  onEnterDiary?: () => void;
}) {
  const weightKg = parseDecimal(weight);
  const height = parseDecimal(heightCm);
  const year = Number.parseInt(birthYear, 10);
  const preview =
    weightKg != null
      ? suggestMacroGoals({
          sex,
          weightKg,
          goal,
          protein: null,
          activity_level: activity,
          height_cm: height,
          birth_year:
            birthYear.trim() !== "" && Number.isFinite(year) ? year : null,
          goal_pace: goal === "keep" ? null : goalPace,
        })
      : null;

  if (preview == null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-surface flex flex-col gap-3 px-5 py-4">
        <p className="text-sm font-medium text-muted-foreground">
          Посчитали цели
        </p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {preview.protein} г белка
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {proteinLine(preview.protein, weightKg)}
          {goal === "keep"
            ? " Баланс: калории рядом с расходом, без дефицита и профицита."
            : ` Темп уже в калориях: ${paceHint(goal, goalPace ?? "normal")}.`}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {foodOnly
            ? `${formatKcal(preview.rest.kcal)} ккал, жир ${preview.rest.fat} г, углеводы ${preview.rest.carbs} г. Свой БЖУ можно поменять в Настройках → «Цели на день».`
            : `Без зала — ${formatKcal(preview.rest.kcal)} ккал, жир ${preview.rest.fat} г, углеводы ${preview.rest.carbs} г. В день тренировки в зале — ${formatKcal(preview.training.kcal)} ккал. Дома и разгрузка остаются на калориях отдыха. Свой БЖУ можно изменить в Настройках → «Цели на день».`}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Когда две недели есть еда и хотя бы три взвешивания, предложим новую
          цифру. Пока не нажмёшь «Поставить», цели не меняются.
        </p>
      </div>
      {canEnterDiary && onEnterDiary ? (
        <OnboardingPrimaryAction
          saving={saving}
          label="К дневнику"
          savingLabel="Открываю дневник…"
          onClick={onEnterDiary}
        />
      ) : null}
      {onContinue ? (
        <OnboardingPrimaryAction
          saving={saving}
          isLast={isLast}
          variant={canEnterDiary ? "outline" : "default"}
          label={
            canEnterDiary
              ? foodOnly
                ? "Еда на день"
                : "Рацион и программа"
              : undefined
          }
          onClick={onContinue}
        />
      ) : null}
    </div>
  );
}
