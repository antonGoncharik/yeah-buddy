"use client";

import { ProgramPresetCatalog } from "@/components/workout/program-preset-list";
import type { OnboardingCircle } from "@/lib/onboarding";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import { isProgramPresetId } from "@/lib/workout/program-presets";

export function OnboardingCircleStep({
  value,
  fromMealPack,
  picking,
  saving,
  onChange,
  onBeginner,
  onPickYourself,
}: {
  value: OnboardingCircle;
  fromMealPack: boolean;
  picking: boolean;
  saving: boolean;
  onChange: (value: OnboardingCircle) => void;
  onBeginner: () => void;
  onPickYourself: () => void;
}) {
  if (!picking) {
    return (
      <>
        {fromMealPack ? (
          <p className="animate-rise text-base text-muted-foreground">
            Еда на день возьмётся из ссылки.
          </p>
        ) : null}
        <ChoiceCard
          title="Не знаю, что делать"
          hint="Поставим «Всё тело»: два дня на всё тело по кругу."
          disabled={saving}
          onClick={() => {
            haptic("tick");
            onBeginner();
          }}
        />
        <ChoiceCard
          title="Знаю, что хочу"
          hint="Покажу все программы — выберешь сам."
          disabled={saving}
          onClick={() => {
            haptic("tap");
            onPickYourself();
          }}
        />
      </>
    );
  }

  return (
    <>
      {fromMealPack ? (
        <p className="animate-rise text-base text-muted-foreground">
          Еда на день возьмётся из ссылки.
        </p>
      ) : null}
      <ProgramPresetCatalog
        expanded
        disabled={saving}
        value={isProgramPresetId(value) ? value : null}
        onPick={onChange}
      />
      <button
        type="button"
        aria-pressed={value === "empty"}
        disabled={saving}
        className={cn(
          "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50",
          value === "empty"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "card-surface hover:bg-muted/30",
        )}
        onClick={() => {
          if (value !== "empty") {
            haptic("tick");
          }
          onChange("empty");
        }}
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

function ChoiceCard({
  title,
  hint,
  disabled,
  onClick,
}: {
  title: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="card-surface w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50"
      onClick={onClick}
    >
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </button>
  );
}
