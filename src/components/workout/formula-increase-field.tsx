"use client";

import { Input } from "@/components/ui/input";

export function FormulaIncreaseField({
  maxIncrease,
  cycleRaises,
  onChange,
}: {
  maxIncrease: string;
  cycleRaises: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Шаг вверх</h2>
        <div className="flex items-center gap-1.5">
          <Input
            inputMode="decimal"
            value={maxIncrease}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-16 px-2 text-center text-base tabular-nums"
            aria-label="Шаг вверх к 1ПМ, процентов"
          />
          <span className="text-base text-muted-foreground">%</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {cycleRaises
          ? "На сколько поднимать 1ПМ в конце этапа с пометкой «поднять 1ПМ». Без цикла — столько же предложим после лёгкой тренировки."
          : "На сколько предложить поднять 1ПМ, когда тренировка прошла легко."}
      </p>
    </section>
  );
}
