"use client";

import { useEffect, useState } from "react";

import { ProgramPresetList } from "@/components/workout/program-preset-list";
import type { OnboardingCircle } from "@/lib/onboarding";
import { isExtraProgram } from "@/lib/onboarding/setup";
import { cn } from "@/lib/utils";
import {
  isProgramPresetId,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

export function OnboardingCircleStep({
  value,
  fromMealPack,
  onChange,
}: {
  value: OnboardingCircle;
  fromMealPack: boolean;
  onChange: (value: OnboardingCircle) => void;
}) {
  const extraSelected = isExtraProgram(value);
  const [showMore, setShowMore] = useState(extraSelected);

  useEffect(() => {
    if (extraSelected) {
      setShowMore(true);
    }
  }, [extraSelected]);

  return (
    <>
      <p className="animate-rise text-base text-muted-foreground">
        {fromMealPack
          ? "Еда на день возьмётся из ссылки. Осталось выбрать программу тренировок. 1ПМ спросим в зале."
          : "Какие дни будут в программе. Если у программы есть недели — они встанут сами. 1ПМ спросим в зале."}
      </p>
      <ProgramPresetList
        value={isProgramPresetId(value) ? value : null}
        recommendedId={RECOMMENDED_PROGRAM_PRESET_ID}
        ids={[RECOMMENDED_PROGRAM_PRESET_ID]}
        showLevelLabels={false}
        onPick={onChange}
      />
      {showMore ? (
        <ProgramPresetList
          value={isProgramPresetId(value) ? value : null}
          compact
          excludeIds={[RECOMMENDED_PROGRAM_PRESET_ID]}
          onPick={onChange}
        />
      ) : (
        <button
          type="button"
          className="px-1 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShowMore(true)}
        >
          Ещё программы
        </button>
      )}
      <button
        type="button"
        aria-pressed={value === "empty"}
        className={cn(
          "card-surface w-full px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none",
          value === "empty" && "ring-2 ring-primary",
        )}
        onClick={() => onChange("empty")}
      >
        <p className="text-lg font-medium">Без программы</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Не хожу в зал или соберу тренировки сам.
        </p>
      </button>
    </>
  );
}
