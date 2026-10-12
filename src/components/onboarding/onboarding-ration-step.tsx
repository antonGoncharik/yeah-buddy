"use client";

import { RationCards } from "@/components/food/ration-cards";
import type { RationId } from "@/lib/food/ration";
import {
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { UserActivityLevel, UserGoalPace } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseDecimal } from "@/lib/workout/numbers";

export function OnboardingRationStep({
  ration,
  selfSetup,
  invalid,
  sex,
  weight,
  goal,
  activity = null,
  goalPace = null,
  heightCm = "",
  birthYear = "",
  onPickSelfSetup,
  onPick,
}: {
  ration: RationId | null;
  selfSetup: boolean;
  invalid: boolean;
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  activity?: UserActivityLevel | null;
  goalPace?: UserGoalPace | null;
  heightCm?: string;
  birthYear?: string;
  onPickSelfSetup: () => void;
  onPick: (id: RationId) => void;
}) {
  const weightKg = parseDecimal(weight);
  const height = parseDecimal(heightCm);
  const year = Number.parseInt(birthYear, 10);
  const suggested =
    sex && goal && weightKg != null
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

  if (suggested == null) {
    return (
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Вернись назад и укажи пол, вес и цель — без них рацион не подогнать.
      </p>
    );
  }

  const nothingPicked = !selfSetup && ration == null;

  return (
    <div className="flex flex-col gap-2 pb-2">
      {nothingPicked ? (
        <p className="text-base text-muted-foreground">
          Выбери один вариант — шаблон на день или настроишь еду сам в
          Настройках.
        </p>
      ) : (
        <p className="text-base text-muted-foreground">
          Шаблон всегда можно изменить в Настройках → «Еда на день».
        </p>
      )}
      <fieldset
        className="flex min-w-0 flex-col gap-2 border-0 p-0 m-0"
        aria-label="Еда на день"
        aria-invalid={invalid || undefined}
      >
        <button
          type="button"
          aria-pressed={selfSetup}
          className={cn(
            "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none",
            selfSetup
              ? "bg-primary text-primary-foreground shadow-sm"
              : "card-surface hover:bg-muted/30",
            invalid && nothingPicked && "border border-destructive/50",
          )}
          onClick={() => {
            if (!selfSetup) {
              haptic("tick");
            } else {
              haptic("tap");
            }
            onPickSelfSetup();
          }}
        >
          <p className="text-lg font-medium">Настрою сам</p>
          <p
            className={cn(
              "mt-1 text-sm leading-snug",
              selfSetup
                ? "text-primary-foreground/85"
                : "text-muted-foreground",
            )}
          >
            Без шаблона сейчас — соберёшь приёмы и продукты позже.
          </p>
        </button>
        <RationCards
          selected={selfSetup ? null : ration}
          goals={{ rest: suggested.rest, training: suggested.training }}
          onPick={onPick}
        />
      </fieldset>
    </div>
  );
}
