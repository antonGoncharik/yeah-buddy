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
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Шаг вверх</h2>
        <p className="text-sm text-muted-foreground">к рабочему весу</p>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        {cycleRaises
          ? "На сколько поднимать рабочий вес в конце этапа, где стоит «Поднять веса». Без цикла — столько же предложим после тренировки, которая прошла легко."
          : "На сколько предлагать поднять рабочий вес, когда тренировка прошла легко. Поднимать можно не все упражнения сразу."}
      </p>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          value={maxIncrease}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-24 text-base"
          aria-label="Шаг вверх к рабочему весу"
        />
        <span className="text-lg text-muted-foreground">%</span>
      </div>
    </section>
  );
}
