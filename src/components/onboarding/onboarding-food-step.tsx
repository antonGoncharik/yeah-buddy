"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKcal, type macroGoalsFromProtein } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import { parseDecimal } from "@/lib/workout/numbers";

const PROTEIN_PRESETS = [100, 120, 150] as const;

export function OnboardingFoodStep({
  protein,
  preview,
  replay,
  fromWorkoutPack,
  onProteinChange,
}: {
  protein: string;
  preview: ReturnType<typeof macroGoalsFromProtein> | null;
  replay: boolean;
  fromWorkoutPack: boolean;
  onProteinChange: (value: string) => void;
}) {
  const selected = parseDecimal(protein);

  return (
    <>
      <p
        className="animate-rise text-base text-muted-foreground"
        style={{ animationDelay: "40ms" }}
      >
        {foodLead(replay, fromWorkoutPack)}
      </p>
      <div
        className="animate-rise flex gap-2"
        style={{ animationDelay: "80ms" }}
      >
        {PROTEIN_PRESETS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={selected === value ? "default" : "outline"}
            className="h-12 flex-1 text-base"
            onClick={() => {
              if (selected !== value) {
                haptic("tick");
              }
              onProteinChange(String(value));
            }}
          >
            {value} г
          </Button>
        ))}
      </div>
      <div
        className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        style={{ animationDelay: "120ms" }}
      >
        <Label htmlFor="onboarding-protein" className="text-base">
          Белок, г
        </Label>
        <Input
          id="onboarding-protein"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={protein}
          onChange={(event) => onProteinChange(event.target.value)}
          className="h-12 text-base"
        />
        {preview ? (
          <p className="text-sm text-muted-foreground">
            Получится: день отдыха — {formatKcal(preview.rest.kcal)} ккал, день
            тренировки — {formatKcal(preview.training.kcal)} ккал.
          </p>
        ) : null}
      </div>
      <p
        className="animate-rise px-1 text-sm leading-relaxed text-muted-foreground"
        style={{ animationDelay: "160ms" }}
      >
        Не знаешь, сколько ставить? Обычный ориентир — 1,6–2 г на килограмм
        веса. Потом это можно поменять в Настройках → «Цели на день».
      </p>
      {replay ? null : (
        <p
          className="animate-rise px-1 text-sm leading-relaxed text-muted-foreground"
          style={{ animationDelay: "200ms" }}
        >
          Первый день откроется с примером: овсянка, яйца, курица, творог.
          Граммы подгоним под белок. Ешь другое — на «Сегодня» нажми «Убрать
          пример» и запиши своё.
        </p>
      )}
    </>
  );
}

function foodLead(replay: boolean, fromWorkoutPack: boolean): string {
  if (fromWorkoutPack) {
    return "Программа тренировок возьмётся из ссылки. Осталось указать, сколько белка ты хочешь съедать в день.";
  }
  if (replay) {
    return "Сколько белка ты хочешь съедать в день. Изменятся только цели — еда на день и записи останутся.";
  }
  return "Сколько белка ты хочешь съедать в день. От этой цифры посчитаем калории и цели на дни отдыха и тренировок.";
}
