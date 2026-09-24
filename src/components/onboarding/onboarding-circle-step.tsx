"use client";

import { ProgramPresetCatalog } from "@/components/workout/program-preset-list";
import type { OnboardingCircle } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { isProgramPresetId } from "@/lib/workout/program-presets";

export function OnboardingCircleStep({
  value,
  fromMealPack,
  onChange,
}: {
  value: OnboardingCircle;
  fromMealPack: boolean;
  onChange: (value: OnboardingCircle) => void;
}) {
  return (
    <>
      <p className="animate-rise text-base text-muted-foreground">
        {fromMealPack
          ? "Еда на день возьмётся из ссылки. Сверху — «Всё тело», остальные за «Ещё программы»."
          : ""}
      </p>
      <ProgramPresetCatalog
        value={isProgramPresetId(value) ? value : null}
        onPick={onChange}
      />
      <button
        type="button"
        aria-pressed={value === "empty"}
        className={cn(
          "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none",
          value === "empty"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "card-surface hover:bg-muted/30",
        )}
        onClick={() => onChange("empty")}
      >
        <p className="text-lg font-medium">Без программы</p>
        <p
          className={cn(
            "mt-1 text-sm",
            value === "empty"
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          Не хожу в зал или соберу очередь сам.
        </p>
      </button>
    </>
  );
}
