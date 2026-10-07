"use client";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { Button } from "@/components/ui/button";
import {
  type EnergyGoalOffer,
  energyGoalLine,
} from "@/lib/nutrition/energy-goal";
import { cn } from "@/lib/utils";

export function EnergyGoalCard({
  offer,
  busy,
  onApply,
  onDismiss,
}: {
  offer: EnergyGoalOffer;
  busy: boolean;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  return (
    <section
      className={cn(
        "card-surface flex flex-col border border-primary/15 bg-primary/5",
        compact ? "gap-2 px-4 py-3" : "gap-3 px-5 py-4",
      )}
    >
      <p className={cn("leading-snug", compact ? "text-sm" : "text-base")}>
        {energyGoalLine(offer)}
      </p>
      <Button
        className="h-12 w-full text-base"
        disabled={busy}
        onClick={onApply}
      >
        Поставить
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground disabled:opacity-50"
        disabled={busy}
        onClick={onDismiss}
      >
        Оставить
      </button>
    </section>
  );
}
