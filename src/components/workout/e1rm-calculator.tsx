"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { estimateE1rm } from "@/lib/workout/e1rm";
import { parseDecimal } from "@/lib/workout/numbers";

export function E1rmCalculator() {
  const [weight, setWeight] = useState("80");
  const [reps, setReps] = useState("5");

  const e1rm = useMemo(() => {
    const w = parseDecimal(weight);
    const r = Number.parseInt(reps, 10);
    if (w == null || w <= 0 || !Number.isFinite(r) || r < 1 || r > 30) {
      return null;
    }
    return estimateE1rm(w, r, null);
  }, [reps, weight]);

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-xl font-semibold">Оценка максимума</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          По весу и повторам рабочего подхода — сколько вышло бы на одно
          повторение.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Вес, кг</span>
          <Input
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            aria-label="Вес, кг"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Повторы</span>
          <Input
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            aria-label="Повторы"
          />
        </div>
      </div>
      <p className="text-lg font-medium tabular-nums">
        {e1rm != null ? `≈ ${e1rm} кг` : "—"}
      </p>
    </section>
  );
}
