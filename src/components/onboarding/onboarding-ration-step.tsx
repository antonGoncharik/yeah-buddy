"use client";

import { RationCards } from "@/components/food/ration-cards";
import type { RationId } from "@/lib/food/ration";
import {
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import { parseDecimal } from "@/lib/workout/numbers";

export function OnboardingRationStep({
  ration,
  sex,
  weight,
  goal,
  onPick,
}: {
  ration: RationId;
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  onPick: (id: RationId) => void;
}) {
  const weightKg = parseDecimal(weight);
  const suggested =
    sex && goal && weightKg != null
      ? suggestMacroGoals({ sex, weightKg, goal, protein: null })
      : null;

  if (suggested == null) {
    return (
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Вернись назад и заполни блок «Про тебя» — без него рацион не подогнать.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-2">
      <p className="text-sm leading-snug text-muted-foreground">
        Шаблон на новый день. «Дальше» — обычный рацион; другой — в Настройках →
        «Еда на день».
      </p>
      <RationCards
        compact
        selected={ration}
        goals={{ rest: suggested.rest, training: suggested.training }}
        onPick={onPick}
      />
    </div>
  );
}
