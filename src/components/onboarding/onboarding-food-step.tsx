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
  fromWorkoutPack,
  onProteinChange,
}: {
  protein: string;
  preview: ReturnType<typeof macroGoalsFromProtein> | null;
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
        {fromWorkoutPack
          ? "Это дневник еды и зала. Зал возьмём из ссылки. Сначала белок на день — от него шаблон еды. 120 хватает большинству."
          : "Это дневник еды и зала. Сначала белок на день — от него шаблон. 120 хватает большинству. Потом поправишь."}
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
          className="h-12 scroll-mb-36 text-base"
        />
        {preview ? (
          <p className="text-sm text-muted-foreground">
            Жир и углеводы пока как обычно. Отдых{" "}
            {formatKcal(preview.rest.kcal)} ккал · зал{" "}
            {formatKcal(preview.training.kcal)} ккал
          </p>
        ) : null}
      </div>
    </>
  );
}
