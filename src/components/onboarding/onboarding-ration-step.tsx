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
  proteinOverride,
  onPick,
}: {
  ration: RationId;
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  proteinOverride: string | null;
  onPick: (id: RationId) => void;
}) {
  const weightKg = parseDecimal(weight);
  const override =
    proteinOverride != null ? parseDecimal(proteinOverride) : null;
  const suggested =
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

  if (suggested == null) {
    return (
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        Вернись назад и проверь вес, пол и цель — без них рацион не подогнать.
      </p>
    );
  }

  return (
    <div
      className="animate-rise flex flex-col gap-3"
      style={{ animationDelay: "40ms" }}
    >
      <p className="text-base text-muted-foreground">
        Готовый день из продуктов, которые уже есть. Граммы подгоним под твои
        цифры. Обычный рацион уже выбран — можно сразу дальше. Потом сменишь в
        Настройках → «Еда на день».
      </p>
      <RationCards
        selected={ration}
        goals={{ rest: suggested.rest, training: suggested.training }}
        onPick={onPick}
      />
    </div>
  );
}
