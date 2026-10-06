"use client";

import { ProgramPresetCatalog } from "@/components/workout/program-preset-list";
import type { OnboardingCircle } from "@/lib/onboarding";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  HOME_PROGRAM_PRESET_IDS,
  isProgramPresetId,
} from "@/lib/workout/program-presets";

export type OnboardingProgramShelf = "all" | "home";

export function OnboardingCircleStep({
  value,
  fromMealPack,
  picking,
  shelf,
  saving,
  onChange,
  onBeginner,
  onHome,
  onPickYourself,
}: {
  value: OnboardingCircle;
  fromMealPack: boolean;
  picking: boolean;
  shelf: OnboardingProgramShelf | null;
  saving: boolean;
  onChange: (value: OnboardingCircle) => void;
  onBeginner: () => void;
  onHome: () => void;
  onPickYourself: () => void;
}) {
  if (!picking) {
    return (
      <div className="flex flex-col gap-2 pb-2">
        {fromMealPack ? (
          <p className="text-sm text-muted-foreground">
            Еда на день возьмётся из ссылки.
          </p>
        ) : null}
        <ChoiceCard
          title="Не знаю что делать"
          hint="Поставим «Всё тело»: 2 разные тренировки, обычно ходят 2–3 раза в неделю."
          disabled={saving}
          onClick={() => {
            haptic("tick");
            onBeginner();
          }}
        />
        <ChoiceCard
          title="Дома"
          hint="Без зала: пол, гантели, турник или ягодицы."
          disabled={saving}
          onClick={() => {
            haptic("tap");
            onHome();
          }}
        />
        <ChoiceCard
          title="Знаю что хочу"
          hint="Все готовые — в зале и дома."
          disabled={saving}
          onClick={() => {
            haptic("tap");
            onPickYourself();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-2">
      {fromMealPack ? (
        <p className="text-sm text-muted-foreground">
          Еда на день возьмётся из ссылки.
        </p>
      ) : null}
      <ProgramPresetCatalog
        disabled={saving}
        ids={shelf === "home" ? HOME_PROGRAM_PRESET_IDS : undefined}
        headings={shelf !== "home"}
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
          Соберу список тренировок сам.
        </p>
      </button>
    </div>
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
      className="card-surface w-full rounded-2xl px-4 py-3 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50"
      onClick={onClick}
    >
      <p className="text-base font-medium">{title}</p>
      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
        {hint}
      </p>
    </button>
  );
}
