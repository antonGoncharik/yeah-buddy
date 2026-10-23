"use client";

import { useEffect, useRef } from "react";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/client";
import { formatKcal } from "@/lib/nutrition";
import {
  type EnergyGoalOffer,
  energyGoalLine,
} from "@/lib/nutrition/energy-goal";
import { cn } from "@/lib/utils";

export function EnergyGoalHintCard({ line }: { line: string }) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  return (
    <section
      className={cn(
        "card-surface border border-border/80 bg-muted/30",
        compact ? "px-4 py-3" : "px-5 py-4",
      )}
    >
      <p
        className={cn(
          "leading-snug text-muted-foreground",
          compact ? "text-sm" : "text-base",
        )}
      >
        {line}
      </p>
    </section>
  );
}

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
  const shown = useRef(false);
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  useEffect(() => {
    if (shown.current) {
      return;
    }
    shown.current = true;
    void trackClientEvent("energy_offer_shown", {
      rest_kcal: offer.restKcal,
    });
  }, [offer.restKcal]);

  const currentRestKcal = offer.currentRestKcal;
  const shift =
    currentRestKcal != null &&
    currentRestKcal > 0 &&
    Math.abs(offer.restKcal - currentRestKcal) >= 50
      ? `Сейчас ${formatKcal(currentRestKcal)} → ${formatKcal(offer.restKcal)} на отдыхе.`
      : null;

  return (
    <section
      className={cn(
        "card-surface flex flex-col border border-primary/15 bg-primary/5",
        compact ? "gap-2 px-4 py-3" : "gap-3 px-5 py-4",
      )}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Цель по дневнику
        </p>
        <p
          className={cn("mt-1 leading-snug", compact ? "text-sm" : "text-base")}
        >
          {energyGoalLine(offer)}
        </p>
        {shift ? (
          <p className="mt-1 text-sm text-muted-foreground">{shift}</p>
        ) : null}
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          Цифра — цель дня отдыха, не вчерашней тренировки. Расход считается по
          всей еде и весу за эти недели. «Поставить» обновит и отдых, и зал: в
          зале углеводов больше.
        </p>
      </div>
      <Button
        className="h-12 w-full text-base"
        disabled={busy}
        onClick={onApply}
      >
        Поставить цель
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground disabled:opacity-50"
        disabled={busy}
        onClick={onDismiss}
      >
        Оставить как есть
      </button>
    </section>
  );
}
