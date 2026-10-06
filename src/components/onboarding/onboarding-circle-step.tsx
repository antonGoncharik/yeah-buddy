"use client";

import { ProgramPresetCatalog } from "@/components/workout/program-preset-list";
import type { OnboardingCircle } from "@/lib/onboarding";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import type { UserSex } from "@/lib/types";
import {
  homeProgramPresetIds,
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
  sex,
}: {
  value: OnboardingCircle;
  fromMealPack: boolean;
  picking: boolean;
  shelf: OnboardingProgramShelf | null;
  saving: boolean;
  sex: UserSex | null;
  onChange: (value: OnboardingCircle) => void;
  onBeginner: () => void;
  onHome: () => void;
  onPickYourself: () => void;
}) {
  if (!picking) {
    const homeFirst = sex === "female";
    const beginner = (
      <ChoiceCard
        title="Не знаю что делать"
        hint="Поставим «Всё тело»: 2 разные тренировки, обычно ходят 2–3 раза в неделю."
        disabled={saving}
        onClick={() => {
          haptic("tick");
          onBeginner();
        }}
      />
    );
    const home = (
      <ChoiceCard
        title="Дома"
        hint={
          homeFirst
            ? "Ягодицы, пол или гантели — без зала."
            : "Без зала: пол, гантели, турник или ягодицы."
        }
        disabled={saving}
        onClick={() => {
          haptic("tap");
          onHome();
        }}
      />
    );
    const pick = (
      <ChoiceCard
        title="Знаю что хочу"
        hint="Выбрать готовую программу или сделать свою."
        disabled={saving}
        onClick={() => {
          haptic("tap");
          onPickYourself();
        }}
      />
    );

    return (
      <div className="flex flex-col gap-2 pb-2">
        {fromMealPack ? (
          <p className="text-base text-muted-foreground">
            Еда на день возьмётся из ссылки.
          </p>
        ) : null}
        {homeFirst ? (
          <>
            {home}
            {beginner}
            {pick}
          </>
        ) : (
          <>
            {beginner}
            {home}
            {pick}
          </>
        )}
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
        ids={shelf === "home" ? homeProgramPresetIds(sex) : undefined}
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
      className="card-surface w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] hover:bg-muted/30 active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50"
      onClick={onClick}
    >
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </button>
  );
}
