"use client";

import { Button } from "@/components/ui/button";
import { QUICK_GRAMS } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";

export function GramChips({
  onPick,
  defaultPortionG,
  defaultPortionLabel,
}: {
  onPick: (grams: number) => void;
  defaultPortionG?: number | null;
  defaultPortionLabel?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {QUICK_GRAMS.map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            className="h-12 text-base"
            onClick={() => {
              haptic("tick");
              onPick(value);
            }}
          >
            {value}
          </Button>
        ))}
      </div>
      {defaultPortionG ? (
        <Button
          type="button"
          variant="secondary"
          className="h-14 text-base"
          onClick={() => {
            haptic("tick");
            onPick(defaultPortionG);
          }}
        >
          {defaultPortionLabel
            ? `Стандартная порция · ${defaultPortionLabel}`
            : "Стандартная порция"}
        </Button>
      ) : null}
    </div>
  );
}
