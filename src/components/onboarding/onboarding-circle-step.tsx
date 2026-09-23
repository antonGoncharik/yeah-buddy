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
          ? "Еда на день возьмётся из ссылки. Сверху — «Всё тело», остальные за «Ещё программы». Максимум на раз спросим в зале."
          : "Сверху — «Всё тело». Остальные программы за «Ещё программы». Если у выбранной есть недели — они встанут сами. Максимум на раз спросим в зале."}
      </p>
      <ProgramPresetCatalog
        value={isProgramPresetId(value) ? value : null}
        onPick={onChange}
      />
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
