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
    <div
      className="animate-rise flex flex-col gap-3"
      style={{ animationDelay: "40ms" }}
    >
      <p className="text-base text-muted-foreground">
        Шаблон на новый день из продуктов, которые уже есть. Граммы под тянутся
        под твои цели. Выбери вариант или жми «Дальше» — подставим обычный день.
        Потом сменишь в Настройках → «Еда на день».
      </p>
      <RationCards
        selected={ration}
        goals={{ rest: suggested.rest, training: suggested.training }}
        onPick={onPick}
      />
    </div>
  );
}
